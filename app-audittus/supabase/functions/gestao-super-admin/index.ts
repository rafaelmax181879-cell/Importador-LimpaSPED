import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const normalizeCnpj = (cnpj: string) => cnpj.replace(/\D/g, "");

const maybeFetchRazaoSocial = async (cnpjDigits: string) => {
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjDigits}`);
    if (!res.ok) return null;
    const payload = await res.json();
    const razao = typeof payload?.razao_social === "string" ? payload.razao_social : null;
    return razao ? razao.replace(/[()]/g, "").trim() : null;
  } catch {
    return null;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Missing Supabase env vars" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: authUserData, error: authUserError } = await authClient.auth.getUser(bearerToken);
  if (authUserError || !authUserData?.user?.id) return json({ error: "Unauthorized" }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const callerUserId = authUserData.user.id;
  const { data: callerColab, error: callerColabError } = await adminClient
    .from("colaboradores")
    .select("cargo")
    .eq("id", callerUserId)
    .maybeSingle();

  if (callerColabError || (callerColab?.cargo ?? "").trim().toUpperCase() !== "SUPER ADMIN") {
    return json({ error: "Unauthorized" }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const action = typeof body?.action === "string" ? body.action : "";

  if (action === "list_users") {
    const { data, error } = await adminClient
      .from("colaboradores")
      .select("email, nome_completo, cnpj_escritorio, escritorios(razao_social_completa)")
      .order("email", { ascending: true });

    if (error) return json({ error: error.message }, 400);

    const users = (data ?? []).map((row: any) => ({
      email: row.email ?? "",
      nome: row.nome_completo ?? "",
      cnpj_escritorio: row.cnpj_escritorio ?? "",
      escritorio: row.escritorios?.razao_social_completa ?? "",
    }));

    return json({ users });
  }

  if (action === "create_user") {
    const emailRaw = typeof body?.email === "string" ? body.email : "";
    const nomeRaw = typeof body?.nome === "string" ? body.nome : "";
    const cargoRaw = typeof body?.cargo === "string" ? body.cargo : "";
    const cnpjRaw = typeof body?.cnpj_escritorio === "string" ? body.cnpj_escritorio : "";

    const email = normalizeEmail(emailRaw);
    const nome = nomeRaw.trim();
    const cargo = cargoRaw.trim();
    const cnpjDigits = normalizeCnpj(cnpjRaw);

    if (!email.includes("@")) return json({ error: "Email inválido" }, 400);
    if (!nome) return json({ error: "Nome obrigatório" }, 400);
    if (!cargo) return json({ error: "Cargo obrigatório" }, 400);
    if (cnpjDigits.length !== 14) return json({ error: "CNPJ do escritório inválido" }, 400);

    const tempPassword = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

    const { data: createdAuth, error: createdAuthError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { primeiro_acesso: true },
    });

    if (createdAuthError || !createdAuth?.user?.id) {
      return json({ error: createdAuthError?.message ?? "Falha ao criar Auth" }, 400);
    }

    const authUserId = createdAuth.user.id;

    const { data: officeFound, error: officeFindError } = await adminClient
      .from("escritorios")
      .select("id, razao_social_completa, cnpj")
      .eq("cnpj", cnpjDigits)
      .maybeSingle();

    if (officeFindError) return json({ error: officeFindError.message }, 400);

    let escritorioId = officeFound?.id ?? null;

    if (!escritorioId) {
      const razaoSocial = (await maybeFetchRazaoSocial(cnpjDigits)) ?? `Escritório ${cnpjDigits}`;
      const { data: officeCreated, error: officeCreateError } = await adminClient
        .from("escritorios")
        .insert([{ cnpj: cnpjDigits, razao_social_completa: razaoSocial }])
        .select("id")
        .single();

      if (officeCreateError || !officeCreated?.id) {
        return json({ error: officeCreateError?.message ?? "Falha ao criar escritório" }, 400);
      }

      escritorioId = officeCreated.id;
    }

    const { error: colabInsertError } = await adminClient.from("colaboradores").insert([
      {
        id: authUserId,
        email,
        nome_completo: nome,
        cargo,
        trocar_senha: true,
        escritorio_id: escritorioId,
        cnpj_escritorio: cnpjDigits,
      },
    ]);

    if (colabInsertError) {
      await adminClient.auth.admin.deleteUser(authUserId);
      return json({ error: colabInsertError.message }, 400);
    }

    return json({ created: { email, temp_password: tempPassword } });
  }

  return json({ error: "Invalid action" }, 400);
});
