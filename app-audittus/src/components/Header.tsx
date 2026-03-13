import React from 'react'

type UsuarioHeader = {
  nome_escritorio?: string
  cnpj_escritorio?: string
  email?: string
  plano?: string
}

export function UserProfileCard({
  usuario,
}: {
  usuario?: UsuarioHeader
}) {
  const plano = (usuario?.plano || '').toString().trim().toLowerCase()
  const isPremium = plano === 'premium'

  return (
    <div className="flex flex-col bg-white p-4 px-6 rounded-2xl shadow-xl min-w-fit z-[99999] border border-gray-50">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="text-gray-950 font-extrabold text-base leading-tight truncate">
              {usuario?.nome_escritorio || 'Escritório'}
            </div>
            
            {isPremium && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full shrink-0 border border-emerald-200">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  PREMIUM
                </span>
              </div>
            )}
          </div>

          <div className="text-gray-500 text-xs font-medium mt-1 truncate">
            {usuario?.cnpj_escritorio || 'CNPJ não informado'}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 mt-2 pt-2">
        <div className="text-gray-400 text-[11px] break-all">
          {usuario?.email || ''}
        </div>
      </div>
    </div>
  )
}
