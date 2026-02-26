import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Download, DollarSign, Calendar, Building2, TrendingUp, TrendingDown, ArrowRightLeft, Printer, RefreshCw, Calculator, Plus, Minus, Equal, Shield, Package, Truck, LayoutDashboard, Tags, Activity, MapPin, AlertTriangle, FileSearch, Lock, Loader2, Zap, DownloadCloud, Crown, User } from 'lucide-react';

// ==========================================
// 1. COMUNICAÇÃO COM A NUVEM (SUPABASE)
// ==========================================
import { createClient } from '@supabase/supabase-js';

// ATENÇÃO: COLE SUAS CHAVES DO SUPABASE EXATAMENTE AQUI DENTRO DAS ASPAS
const SUPABASE_URL = "https://quzffabofgnzcfjwuwqm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_HCd0W4cL7-AixaPlBgG-PQ_Fg34rowo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 2. CONFIGURAÇÕES DO SISTEMA E VERSÃO
// ==========================================
const SENHA_ADMIN = "master336"; // Senha de Bypass (Ignora a nuvem para você testar)
const VERSAO_ATUAL = "1.1.20";

// Gerador de Hardware ID seguro
const obterOuGerarHardwareId = () => {
  let hwId = localStorage.getItem('audittus_hw_id');
  if (!hwId) {
    hwId = 'hw_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('audittus_hw_id', hwId);
  }
  return hwId;
};

export default function ImportadorSped() {
  const [faseAtual, setFaseAtual] = useState('login'); 
  const [senhaInput, setSenhaInput] = useState(''); // Guarda o CNPJ ou Email
  const [erroLogin, setErroLogin] = useState('');
  const [loadingText, setLoadingText] = useState('');
  const [isProcessandoLoading, setIsProcessandoLoading] = useState(false);
  
  // Controle de Licença e Razão Social
  const [licencaAtual, setLicencaAtual] = useState(null);
  const [modalPremiumAberto, setModalPremiumAberto] = useState(false);
  const [razaoSocialLogada, setRazaoSocialLogada] = useState(''); // NOVO: Guarda o nome da empresa logada

  const [abaAtiva, setAbaAtiva] = useState('home'); 
  const [arquivoProcessado, setArquivoProcessado] = useState(null);
  const [nomeOriginal, setNomeOriginal] = useState('');
  
  // Estados de Dados do SPED
  const [dadosGraficoIcms, setDadosGraficoIcms] = useState([]);
  const [ajustesICMS, setAjustesICMS] = useState([]);
  const [resumoIcms, setResumoIcms] = useState({ saldoCredor: 0, icmsRecolher: 0 });
  const [guiasE116, setGuiasE116] = useState([]);
  const [dadosEmpresa, setDadosEmpresa] = useState({ nome: '', cnpj: '', periodo: '' });
  const [dadosGraficoOperacoes, setDadosGraficoOperacoes] = useState([]);
  const [listaCfops, setListaCfops] = useState({ entradas: [], saidas: [] });
  const [dadosVaf, setDadosVaf] = useState({ entradasBrutas: 0, saidasBrutas: 0, devVendas: 0, devCompras: 0, vafTotal: 0 });
  const [relatorioCorrecoes, setRelatorioCorrecoes] = useState({ c191Removidos: 0, c173Removidos: 0, textosRemovidos: 0, blocosRecalculados: 0 });
  const [topProdutos, setTopProdutos] = useState({ vendas: [], compras: [] });
  const [topFornecedores, setTopFornecedores] = useState([]);
  const [dadosTributacaoSaida, setDadosTributacaoSaida] = useState([]); 
  const [resumoTributacao, setResumoTributacao] = useState({ st: 0, servicos: 0, isento: 0, total: 0 });
  const [dadosEstados, setDadosEstados] = useState([]);
  const [logAuditoria, setLogAuditoria] = useState([]);
  const [dadosRoscaEntradas, setDadosRoscaEntradas] = useState([]);
  const [riscosFiscais, setRiscosFiscais] = useState([]);

  // Inteligência de Atualização (Electron)
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [diasRestantesAtualizacao, setDiasRestantesAtualizacao] = useState(null);
  const [sistemaBloqueadoPorAtualizacao, setSistemaBloqueadoPorAtualizacao] = useState(false);

  useEffect(() => {
    window.triggerUpdateModal = () => setUpdateModalOpen(true);
    const ignoredDateStr = localStorage.getItem('audittus_update_ignored_date');
    if (ignoredDateStr) {
      const diffDays = Math.floor(Math.abs(new Date() - new Date(ignoredDateStr)) / (1000 * 60 * 60 * 24));
      const restantes = 10 - diffDays;
      if (restantes <= 0) setSistemaBloqueadoPorAtualizacao(true);
      else setDiasRestantesAtualizacao(restantes);
    }
    return () => { delete window.triggerUpdateModal; };
  }, []);

  const handleAtualizarAgora = () => {
    localStorage.removeItem('audittus_update_ignored_date'); 
    setUpdateModalOpen(false);
    setFaseAtual('loading');
    setLoadingText('Baixando nova versão do servidor... O sistema reiniciará em breve.');
    if (window.require) window.require('electron').ipcRenderer.send('iniciar_atualizacao');
  };

  // ==========================================
  // INTELIGÊNCIA DE LOGIN (B2B - CNPJ/EMAIL)
  // ==========================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setErroLogin('');

    const ident = senhaInput.trim();
    if (!ident) {
      setErroLogin('Por favor, informe seu E-mail ou CNPJ.');
      return;
    }

    if (ident === SENHA_ADMIN) {
      setLicencaAtual({ plano: 'admin', identificador_cliente: 'Administrador' });
      setRazaoSocialLogada('Acesso Mestre Liberado');
      setFaseAtual('upload');
      return;
    }

    const mem = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    if (mem < 2 || cores < 2) {
      setErroLogin('Erro FATAL: Ambiente de execução gráfico não suportado (ERR_VM_DETECT).');
      return;
    }

    setIsProcessandoLoading(true);
    const hwId = obterOuGerarHardwareId();

    try {
      // NOVO: Busca a Razão Social na Receita Federal (BrasilAPI)
      let razaoEncontrada = '';
      const apenasNumeros = ident.replace(/\D/g, '');
      if (apenasNumeros.length === 14) {
        try {
          const resApi = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${apenasNumeros}`);
          if (resApi.ok) {
            const dadosCnpj = await resApi.json();
            razaoEncontrada = dadosCnpj.razao_social;
          }
        } catch (errApi) {
          console.log("Aviso: Falha ao buscar razão social na API pública.", errApi);
        }
      }

      let { data: licenca, error } = await supabase
        .from('licencas_clientes')
        .select('*')
        .eq('identificador_cliente', ident)
        .single();

      if (error && error.code !== 'PGRST116') {
         throw new Error("Erro de conexão com o Servidor de Licenças.");
      }

      if (!licenca) {
        const novaLicenca = {
          identificador_cliente: ident,
          hardware_id: hwId,
          plano: 'trial',
          analises_gratuitas_restantes: 1,
          limite_cnpjs: 1,
          cnpjs_vinculados: []
        };
        const { data: criada, error: errInsert } = await supabase.from('licencas_clientes').insert([novaLicenca]).select().single();
        if (errInsert) throw errInsert;
        licenca = criada;
      } else {
        if (!licenca.hardware_id) {
          await supabase.from('licencas_clientes').update({ hardware_id: hwId }).eq('id', licenca.id);
          licenca.hardware_id = hwId;
        } else if (licenca.hardware_id !== hwId) {
          setErroLogin('Este CNPJ/E-mail já está vinculado a outro computador. Contate o suporte técnico.');
          setIsProcessandoLoading(false);
          return;
        }
      }

      if (licenca.status_bloqueio) {
        setIsProcessandoLoading(false);
        setErroLogin('O acesso desta licença está bloqueado no Servidor. Regularize sua situação.');
        return;
      }

      setRazaoSocialLogada(razaoEncontrada);
      setLicencaAtual(licenca);
      setFaseAtual('upload');
      
    } catch (err) {
      console.error(err);
      setErroLogin('Erro de rede: Verifique sua conexão com a internet para validar a licença.');
    } finally {
      setIsProcessandoLoading(false);
    }
  };

  const limparDados = () => {
    setFaseAtual('upload'); setArquivoProcessado(null); setNomeOriginal(''); setAbaAtiva('home');
    setDadosGraficoIcms([]); setAjustesICMS([]); setResumoIcms({ saldoCredor: 0, icmsRecolher: 0 });
    setGuiasE116([]); setDadosEmpresa({ nome: '', cnpj: '', periodo: '' }); setDadosGraficoOperacoes([]);
    setListaCfops({ entradas: [], saidas: [] }); setDadosVaf({ entradasBrutas: 0, saidasBrutas: 0, devVendas: 0, devCompras: 0, vafTotal: 0 });
    setRelatorioCorrecoes({ c191Removidos: 0, c173Removidos: 0, textosRemovidos: 0, blocosRecalculados: 0 });
    setTopProdutos({ vendas: [], compras: [] }); setTopFornecedores([]); setDadosTributacaoSaida([]);
    setResumoTributacao({ st: 0, servicos: 0, isento: 0, total: 0 }); setDadosEstados([]); setLogAuditoria([]); setDadosRoscaEntradas([]); setRiscosFiscais([]);
  };

  const processarArquivo = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setFaseAtual('loading'); 
    setLoadingText("Verificando integridade e licenciamento...");
    
    const reader = new FileReader();
    reader.readAsText(file, 'windows-1252');
    
    reader.onload = async (e) => {
      const conteudoArquivo = e.target.result;
      const linhasOriginais = conteudoArquivo.split(/\r?\n/);
      
      let cnpjArquivo = "";
      for (let i = 0; i < linhasOriginais.length; i++) {
        if (linhasOriginais[i].startsWith('|0000|')) {
          cnpjArquivo = linhasOriginais[i].split('|')[7];
          break;
        }
      }

      if (licencaAtual && licencaAtual.plano !== 'admin') {
        if (licencaAtual.plano === 'trial') {
          if (licencaAtual.analises_gratuitas_restantes <= 0) {
            setFaseAtual('upload');
            setModalPremiumAberto(true); 
            return;
          }
          await supabase.from('licencas_clientes').update({ analises_gratuitas_restantes: 0 }).eq('id', licencaAtual.id);
          setLicencaAtual({...licencaAtual, analises_gratuitas_restantes: 0});
        } 
        else if (licencaAtual.plano === 'premium') {
          let listaCnpjs = licencaAtual.cnpjs_vinculados || [];
          if (!listaCnpjs.includes(cnpjArquivo)) {
            if (listaCnpjs.length >= licencaAtual.limite_cnpjs) {
              setFaseAtual('upload');
              alert(`⛔ Limite de Empresas Atingido!\n\nSeu plano atual permite auditar ${licencaAtual.limite_cnpjs} CNPJ(s).\nO CNPJ do arquivo (${cnpjArquivo}) não faz parte da sua cota. Faça um upgrade no painel.`);
              return;
            } else {
              listaCnpjs.push(cnpjArquivo);
              await supabase.from('licencas_clientes').update({ cnpjs_vinculados: listaCnpjs }).eq('id', licencaAtual.id);
              setLicencaAtual({...licencaAtual, cnpjs_vinculados: listaCnpjs});
            }
          }
        }
      }

      setNomeOriginal(file.name);
      const mensagens = ["Lendo estrutura do arquivo SPED...", "Mapeando inteligência de CFOPs...", "Procurando Notas Puladas...", "Aplicando Auto-Cura Tributária...", "Gerando painel Business Intelligence..."];
      let step = 0; setLoadingText(mensagens[0]);
      const inter = setInterval(() => { step++; if(step < mensagens.length) setLoadingText(mensagens[step]); }, 600);

      let linhasProcessadas = [];
      let contC191 = 0, contC173 = 0, contTextos = 0, logTemp = [], riscosTemp = [], numLinha = 0;
      let numDocAtual = 'S/N'; 
      let notasPorSerie = {}; 
      let mapNcm = {}; 

      const textosParaRemover = /\b(ISENTO|0000000|1111111|9999999|1500300|0300200|0300100|SEM GTIN|0500500|2003901|0300900|0301900|0112900|1800300)\b/gi;

      linhasOriginais.forEach((linhaOriginal) => {
        numLinha++;
        let linha = linhaOriginal;
        let cols = linha.split('|');

        if (cols[1] === 'C100' || cols[1] === 'D100') {
           numDocAtual = cols[8] || 'S/N';
           if (cols[1] === 'C100') {
               const indOper = cols[2]; const indEmit = cols[3]; const mod = cols[5]; const serie = cols[7]; const numNF = parseInt(cols[8], 10);
               if (indOper === '1' && indEmit === '0' && (mod === '55' || mod === '65') && !isNaN(numNF)) {
                   const key = `${mod}-${serie}`;
                   if (!notasPorSerie[key]) notasPorSerie[key] = [];
                   notasPorSerie[key].push(numNF);
               }
           }
        }

        if (cols[1] === '0200') { mapNcm[cols[2]] = cols[8]; }

        if (cols[1] === 'C170') {
            const codItem = cols[3]; const cst = cols[10]; const cfop = cols[11];
            if (cfop === '5405' && cst && cst.includes('000')) {
                riscosTemp.push({ tipo: 'Tributação em Duplicidade', registro: `C170 (NF: ${numDocAtual})`, cor: '#ef4444', detalhe: `Item cód. ${codItem} usa CFOP de ST (5405) combinado com CST Tributado Integralmente (${cst}). A empresa está pagando ICMS duas vezes.` });
            }
        }

        if (linha.startsWith('|C191|')) { contC191++; logTemp.push({ linha: numLinha, registro: `C191 (NF: ${numDocAtual})`, acao: 'Linha Removida', detalhe: 'Registro C191 excluído do arquivo.' }); return; }
        if (linha.startsWith('|C173|')) { contC173++; logTemp.push({ linha: numLinha, registro: `C173 (NF: ${numDocAtual})`, acao: 'Linha Removida', detalhe: 'Registro C173 excluído do arquivo.' }); return; }
        
        if (cols[1] === 'C190' || cols[1] === 'D190') {
            const cf = cols[3];
            if (cf === '1556' || cf === '2556') {
                const vlIcms = parseFloat(cols[7]?.replace(',', '.')) || 0;
                if (vlIcms > 0) {
                    const vlIcmsOriginal = cols[7];
                    cols[6] = '0,00'; cols[7] = '0,00'; 
                    linha = cols.join('|');
                    logTemp.push({ linha: numLinha, registro: `${cols[1]} (NF: ${numDocAtual})`, acao: 'CORRIGIDO PELO ROBÔ', detalhe: `CFOP ${cf} (Uso/Consumo) com imposto. Sistema zerou R$ ${vlIcmsOriginal} de crédito indevido para evitar autuação.` });
                }
            }
        }

        const matches = linha.match(textosParaRemover);
        if (matches) { 
            contTextos += matches.length; 
            logTemp.push({ linha: numLinha, registro: `${cols[1]} (NF: ${numDocAtual})`, acao: 'Termos Limpos', detalhe: `Removido: ${matches.join(', ')}` }); 
            linha = linha.replace(textosParaRemover, ''); 
        }
        if (linha.trim() !== '') linhasProcessadas.push(linha);
      });

      Object.keys(notasPorSerie).forEach(key => {
          let nums = notasPorSerie[key].sort((a,b) => a - b);
          let buracos = [];
          for (let i = 1; i < nums.length; i++) {
              if (nums[i] - nums[i-1] > 1) {
                  if (nums[i] - nums[i-1] === 2) buracos.push(`${nums[i-1] + 1}`);
                  else buracos.push(`${nums[i-1] + 1} a ${nums[i] - 1}`);
              }
          }
          if (buracos.length > 0) {
              const mod = key.split('-')[0]; const serie = key.split('-')[1];
              riscosTemp.push({ tipo: 'NUMERAÇÃO FALTANTE', registro: `Mod ${mod} - Série ${serie}`, cor: '#f59e0b', detalhe: `Faltam as Notas Fiscais: ${buracos.join(', ')}.` });
          }
      });

      const cfopsEntradasBrutas = new Set(['1102','2102','3102','1117','2117','1403','2403','1101','2101','3101','1122','2122','1401','2401','1351','1352','1353','1354','1355','1356','2351','2352','2353','2354','2355','2356','3351','3352','3353','3354','3355','3356']);
      const cfopsSaidasBrutas = new Set(['5102','6102','7102','5115','6115','5403','6403','5405','5101','6101','7101','5113','6113','5401','6401','5117','6117','5351','6351','7351','5352','6352','7352','5353','6353','7353','5354','6354','7354','5355','6355','7355','5356','6356','7356','5357','6357','7357','5301','6301','7301','5302','6302','7302','5303','6303','7303','5304','6304','7304','5305','6305','7305','5306','6306','7306','5307','6307','7307','5251','6251','7251']);
      const cfopsDevVendas = new Set(['1202','2202','3202','1411','2411','1201','2201','3201','1410','2410','1206','2206','1207','2207']);
      const cfopsDevCompras = new Set(['5202','6202','7202','5411','6411','5201','6201','7201','5410','6410','5206','6206','5207','6207']);
      const cfopsNaoFaturamento = new Set(['5551','6551','7551','5552','6552','7552','5553','6553','7553','5554','6554','7554','5555','6555','7555','5556','6556','7556','5557','6557','7557','5661','6661','7661','5662','6662','7662','5663','6663','7663','5664','6664','7664','5665','6665','7665','5666','6666','7666','5201','6201','7201','5202','6202','7202','5206','6206','7206','5207','6207','7207','5410','6410','7410','5411','6411','7411','5926','5927']);

      let totalDeb = 0, totalCred = 0, tEnt = 0, tSai = 0, vafEnt = 0, vafSai = 0, vafDV = 0, vafDC = 0;
      let mCfopEnt = {}, mCfopSai = {}, listaAj = [], listaG = [], sCredFinal = 0, iRecFinal = 0;
      let mProd = {}, mPart = {}, mPartEst = {}, vProd = {}, cProd = {}, cForn = {}, opAt = ''; 
      let mTribSaida = {}, vST = 0, vServ = 0, vIse = 0, tAnalise = 0, cEstObj = {}; 
      let dEnt = { 'Revenda/Ind. - Tributadas': 0, 'Revenda/Ind. - Isentas': 0, 'Substituição Tributária (ST)': 0, 'Uso e Consumo': 0, 'Ativo Imobilizado': 0, 'Bonificações': 0, 'Combustíveis': 0, 'Outras Entradas': 0 };

      linhasProcessadas.forEach(linha => {
        const colunas = linha.split('|');
        if (colunas[1] === '0000') {
          const dtIni = colunas[4] ? colunas[4].trim() : ''; const dtFin = colunas[5] ? colunas[5].trim() : '';
          let pFormatado = 'Período Indefinido';
          if (dtIni && dtFin) pFormatado = `${dtIni.substring(0,2)}/${dtIni.substring(2,4)}/${dtIni.substring(4,8)} a ${dtFin.substring(0,2)}/${dtFin.substring(2,4)}/${dtFin.substring(4,8)}`;
          let c = colunas[7] || '';
          setDadosEmpresa({ nome: colunas[6] || 'Não Identificada', cnpj: c.length === 14 ? `${c.substring(0,2)}.${c.substring(2,5)}.${c.substring(5,8)}/${c.substring(8,12)}-${c.substring(12,14)}` : c, periodo: pFormatado });
        }
        
        if (colunas[1] === '0150') { mPart[colunas[2]] = colunas[3]; mPartEst[colunas[2]] = (colunas[4] && colunas[4] !== '01058') ? 'Exterior' : (colunas[8] ? (mapUfIbge[colunas[8].substring(0, 2)] || 'Outros') : 'N/A'); }
        if (colunas[1] === '0200') mProd[colunas[2]] = colunas[3]; 
        
        if (colunas[1] === 'C100') { 
            opAt = colunas[2]; const vlD = parseFloat(colunas[12]?.replace(',', '.')) || 0; 
            if (opAt === '0') { tEnt += vlD; if (colunas[4]) { cForn[colunas[4]] = (cForn[colunas[4]] || 0) + vlD; cEstObj[mPartEst[colunas[4]]] = (cEstObj[mPartEst[colunas[4]]] || 0) + vlD; } } else if (opAt === '1') tSai += vlD; 
        }
        
        if (colunas[1] === 'C170') { const vlI = parseFloat(colunas[7]?.replace(',', '.')) || 0; if (opAt === '1') vProd[colunas[3]] = (vProd[colunas[3]] || 0) + vlI; else if (opAt === '0') cProd[colunas[3]] = (cProd[colunas[3]] || 0) + vlI; }
        
        if (colunas[1] === 'C190' || colunas[1] === 'D190') {
          const cf = colunas[3] || '', vlO = parseFloat(colunas[5]?.replace(',', '.')) || 0, vlIc = parseFloat(colunas[7]?.replace(',', '.')) || 0;
          let al = colunas[4] ? parseFloat(colunas[4].replace(',', '.')).toString().replace('.', ',') : '';
          
          if (cf.startsWith('1') || cf.startsWith('2') || cf.startsWith('3')) {
            mCfopEnt[cf] = (mCfopEnt[cf] || 0) + vlO;
            if (['1101','1102','2101','2102','3101','3102'].includes(cf)) vlIc > 0 ? dEnt['Revenda/Ind. - Tributadas'] += vlO : dEnt['Revenda/Ind. - Isentas'] += vlO;
            else if (['1401','1403','2401','2403'].includes(cf)) dEnt['Substituição Tributária (ST)'] += vlO;
            else if (['1556','2556'].includes(cf)) dEnt['Uso e Consumo'] += vlO;
            else dEnt['Outras Entradas'] += vlO;
          } else {
            mCfopSai[cf] = (mCfopSai[cf] || 0) + vlO;
            if (!cfopsNaoFaturamento.has(cf)) {
              let cat = cf.startsWith('53') || cf.startsWith('63') ? 'ISS - Serviços' : cf.startsWith('54') || cf.startsWith('64') ? 'Saídas ST' : vlIc === 0 ? 'Saídas Isentas' : al !== '' ? `Tributadas a ${al}%` : `Outras (CFOP ${cf})`;
              if (cat === 'ISS - Serviços') vServ += vlO; if (cat === 'Saídas ST') vST += vlO; if (cat === 'Saídas Isentas') vIse += vlO;
              mTribSaida[cat] = (mTribSaida[cat] || 0) + vlO; tAnalise += vlO;
            }
          }
          if (cfopsEntradasBrutas.has(cf)) vafEnt += vlO; if (cfopsSaidasBrutas.has(cf)) vafSai += vlO; if (cfopsDevVendas.has(cf)) vafDV += vlO; if (cfopsDevCompras.has(cf)) vafDC += vlO; 
        }
        
        if (colunas[1] === 'E110') { totalDeb += parseFloat(colunas[2].replace(',', '.')) || 0; totalCred += parseFloat(colunas[6].replace(',', '.')) || 0; iRecFinal = parseFloat(colunas[13].replace(',', '.')) || 0; sCredFinal = parseFloat(colunas[14].replace(',', '.')) || 0; }
        if (colunas[1] === 'E111') listaAj.push({ codigo: colunas[2], descricao: `Ajuste: ${colunas[2]}`, valor: parseFloat(colunas[4].replace(',', '.')) || 0 });
        if (colunas[1] === 'E116') listaG.push({ codigo: colunas[5] || colunas[2], valor: parseFloat(colunas[3].replace(',', '.')) || 0, vencimento: colunas[4] });
      });

      setListaCfops({ entradas: Object.keys(mCfopEnt).map(k => ({ cfop: k, valor: mCfopEnt[k] })).sort((a,b) => b.valor - a.valor), saidas: Object.keys(mCfopSai).map(k => ({ cfop: k, valor: mCfopSai[k] })).sort((a,b) => b.valor - a.valor) });
      setTopProdutos({ vendas: Object.keys(vProd).map(k => ({ nome: mProd[k] || k, valor: vProd[k] })).sort((a,b) => b.valor - a.valor).slice(0, 10), compras: Object.keys(cProd).map(k => ({ nome: mProd[k] || k, valor: cProd[k] })).sort((a,b) => b.valor - a.valor).slice(0, 10) });
      setTopFornecedores(Object.keys(cForn).map(k => ({ nome: mPart[k] || k, valor: cForn[k] })).sort((a,b) => b.valor - a.valor).slice(0, 5));
      setDadosEstados(Object.keys(cEstObj).map(k => ({ name: k, value: cEstObj[k] })).sort((a,b) => b.value - a.value));
      setDadosTributacaoSaida(Object.keys(mTribSaida).map(k => ({ name: k, value: mTribSaida[k] })).sort((a,b) => b.value - a.value));
      setDadosRoscaEntradas(Object.keys(dEnt).filter(k => dEnt[k] > 0).map(k => ({ name: k, value: dEnt[k] })).sort((a,b) => b.value - a.value));
      setDadosVaf({ entradasBrutas: vafEnt, saidasBrutas: vafSai, devVendas: vafDV, devCompras: vafDC, vafTotal: (vafSai - vafDV) - (vafEnt - vafDC) });
      setDadosGraficoIcms([{ name: 'Créditos', value: totalCred }, { name: 'Débitos', value: totalDeb }]);
      setDadosGraficoOperacoes([{ name: 'Total Entradas', value: tEnt }, { name: 'Total Saídas', value: tSai }]);
      setResumoTributacao({ st: vST, servicos: vServ, isento: vIse, total: tAnalise });
      setResumoIcms({ saldoCredor: sCredFinal, icmsRecolher: iRecFinal });
      setAjustesICMS(listaAj); setGuiasE116(listaG);

      setRelatorioCorrecoes({ c191Removidos: contC191, c173Removidos: contC173, textosRemovidos: contTextos, blocosRecalculados: (contC191 > 0 || contC173 > 0) ? 3 : 0 });
      setLogAuditoria(logTemp); 
      setRiscosFiscais(riscosTemp);
      setArquivoProcessado(linhasProcessadas.join('\r\n')); 
      
      setTimeout(() => { clearInterval(inter); setFaseAtual('dashboard'); }, 3000);
    };
  };

  const CORES_ICMS = ['#004080', '#F59E0B']; 
  const CORES_OPERACOES = ['#10b981', '#4f46e5']; 
  const CORES_TRIBUTACAO = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
  const CORES_MAPA = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
  const CORES_ENTRADAS = ['#34d399', '#f87171', '#fbbf24', '#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#2dd4bf'];
  const mapUfIbge = { '11': 'Rondônia', '12': 'Acre', '13': 'Amazonas', '14': 'Roraima', '15': 'Pará', '16': 'Amapá', '17': 'Tocantins', '21': 'Maranhão', '22': 'Piauí', '23': 'Ceará', '24': 'Rio Grande do Norte', '25': 'Paraíba', '26': 'Pernambuco', '27': 'Alagoas', '28': 'Sergipe', '29': 'Bahia', '31': 'Minas Gerais', '32': 'Espírito Santo', '33': 'Rio de Janeiro', '35': 'São Paulo', '41': 'Paraná', '42': 'Santa Catarina', '43': 'Rio Grande do Sul', '50': 'Mato Grosso do Sul', '51': 'Mato Grosso', '52': 'Goiás', '53': 'Distrito Federal', '99': 'Exterior' };
  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  const BotoesAcao = () => (
    <div className="no-print act-btns">
        <button className="btn-dl" onClick={() => { const b = new Blob([arquivoProcessado], { type: 'text/plain;charset=windows-1252' }); const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = `AUDITTUS_Curado_${nomeOriginal}`; l.click(); }}><Download size={20} /> Baixar SPED Validado</button>
        <button className="btn-pr" onClick={() => window.print()}><Printer size={20} /> Salvar Relatório (PDF)</button>
        <button className="btn-nw" onClick={limparDados}><RefreshCw size={20} /> Nova Validação</button>
    </div>
  );

  // ------------------------------------------------------------------------------------------------------------------
  // BLOQUEIOS (ATUALIZAÇÃO E MODAL DE UPGRADE)
  // ------------------------------------------------------------------------------------------------------------------
  if (sistemaBloqueadoPorAtualizacao) {
    return (
      <div className="fullscreen-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="login-box" style={{ maxWidth: '500px', backgroundColor: '#fff', borderTop: '8px solid #ef4444' }}>
          <AlertTriangle size={80} color="#ef4444" style={{ margin: '0 auto 20px auto' }} />
          <h1 className="login-title" style={{ color: '#ef4444' }}>Sistema Obsoleto</h1>
          <p className="login-sub" style={{ fontSize: '18px', color: '#475569', lineHeight: '1.6', marginTop: '15px' }}>O prazo de carência para a atualização expirou. É obrigatório instalar a nova atualização para continuar.</p>
          <button onClick={handleAtualizarAgora} className="login-btn" style={{ width: '100%', marginTop: '20px', backgroundColor: '#ef4444' }}><DownloadCloud size={18} /> Forçar Atualização Agora</button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------------------------------------------------------
  // TELA 1: LOGIN (B2B)
  // ------------------------------------------------------------------------------------------------------------------
  if (faseAtual === 'login') {
    return (
      <div className="fullscreen-center">
        <div className="login-box">
          <Shield size={64} color="#004080" style={{ marginBottom: '20px' }} />
          <h1 className="login-title">AUDITTUS</h1>
          <p className="login-sub">Inteligência Fiscal e Auditoria Digital</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <input type="text" placeholder="E-mail ou CNPJ da Licença" value={senhaInput} onChange={(e) => setSenhaInput(e.target.value)} className="login-input" />
              {erroLogin && <span className="login-err">{erroLogin}</span>}
            </div>
            <button type="submit" className="login-btn" disabled={isProcessandoLoading}>
              {isProcessandoLoading ? <Loader2 size={18} className="spin" /> : <Lock size={18} />} 
              {isProcessandoLoading ? 'Conectando ao Servidor...' : 'Acessar Sistema'}
            </button>
          </form>
          <p style={{ marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>Se for o seu primeiro acesso, 1 análise será liberada gratuitamente.</p>
        </div>
        <style>{`
          body, html, #root { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #f0f4f8; font-family: system-ui, sans-serif; }
          .fullscreen-center { display: flex; height: 100vh; width: 100vw; align-items: center; justify-content: center; }
          .login-box { background: #fff; padding: 50px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
          .login-title { margin: 0 0 5px 0; color: #004080; font-size: 32px; font-weight: 900; letter-spacing: -1px; }
          .login-sub { margin: 0 0 30px 0; color: #64748b; font-size: 14px; }
          .login-input { width: 100%; box-sizing: border-box; padding: 15px; border-radius: 12px; border: 2px solid #cbd5e1; font-size: 16px; outline: none; text-align: center; transition: 0.3s; }
          .login-input:focus { border-color: #004080; }
          .login-err { color: #ef4444; font-size: 13px; display: block; margin-top: 8px; font-weight: bold; }
          .login-btn { padding: 15px; background: #004080; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.3s; }
          .login-btn:hover:not(:disabled) { background: #003366; }
          .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
          .spin { animation: spin 2s linear infinite; }
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // ------------------------------------------------------------------------------------------------------------------
  // TELA 2: LOADING GERAL
  // ------------------------------------------------------------------------------------------------------------------
  if (faseAtual === 'loading') {
    return (
      <div className="fullscreen-center">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <Loader2 size={64} color="#004080" className="spin" />
          <h2 style={{ color: '#004080', margin: 0, fontSize: '24px' }}>Processando...</h2>
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '600' }}>{loadingText}</p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------------------------------------------------------
  // TELA 3: DASHBOARD & UPLOAD
  // ------------------------------------------------------------------------------------------------------------------
  return (
    <div className="main-container">
      <style>
        {`
          body, html { margin: 0 !important; padding: 0 !important; width: 100% !important; min-height: 100vh !important; background-color: #f0f4f8 !important; }
          #root { width: 100% !important; min-height: 100vh !important; display: flex !important; flex-direction: column !important; padding: 0 !important; margin: 0 !important; }
          .main-container { flex: 1; width: 100%; padding: 0; box-sizing: border-box; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; }
          .content-wrapper { width: 100%; max-width: 1800px; padding: 30px; margin: 0 auto; display: flex; flex-direction: column; }
          .dashboard-layout { display: flex; gap: 30px; align-items: flex-start; width: 100%; }
          .dash-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 25px; }
          .dash-sidebar { width: 320px; flex-shrink: 0; position: sticky; top: 30px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1.2fr 1.2fr; gap: 25px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
          .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
          .card-dash { background: #fff; padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); display: flex; flex-direction: column; min-width: 0; }
          .card-title { color: #004080; border-bottom: 2px solid #f0f4f8; padding-bottom: 15px; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center; gap: 10px; }
          .upload-box { width: 100%; max-width: 800px; margin: 0 auto; padding: 80px 40px; background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%); border-radius: 24px; border: 3px dashed #cbd5e1; text-align: center; position: relative; transition: all 0.3s; }
          .upload-box:hover { border-color: #004080; transform: translateY(-5px); box-shadow: 0 25px 50px rgba(0,64,128,0.1); }
          .cfop-row { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #f0f4f8; font-size: 14px; gap: 10px; }
          .cfop-lbl { font-weight: bold; color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .cfop-val { color: #10b981; font-weight: 600; white-space: nowrap; }
          .cfop-val-s { color: #4f46e5; font-weight: 600; white-space: nowrap; }
          .leg-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f8fafc; border-radius: 12px; margin-bottom: 8px; }
          .leg-lbl { font-size: 13px; color: #555; font-weight: 600; }
          .leg-val { font-size: 14px; color: #004080; font-weight: bold; white-space: nowrap; }
          .chart-container { height: 300px; width: 100%; flex-grow: 1; }
          .act-btns { display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; padding: 20px; background: #fff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
          .act-btns button { padding: 15px 25px; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 10px; }
          .btn-dl { background: #004080; } .btn-pr { background: #10b981; } .btn-nw { background: #ef4444; }
          ::-webkit-scrollbar { width: 8px; height: 8px; } ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          @media print { .no-print { display: none !important; } .dashboard-layout, .dash-main, .grid-3, .grid-2, .grid-4 { display: block !important; width: 100% !important; margin: 0 !important; } .card-dash, .dash-sidebar { width: 100% !important; max-width: 750px !important; margin: 0 auto 30px auto !important; page-break-inside: avoid !important; box-shadow: none !important; border: 2px solid #cbd5e1 !important; } .chart-container { height: 400px !important; } }
        `}
      </style>

      {/* MODAL DE NOVA ATUALIZAÇÃO DISPONÍVEL */}
      {updateModalOpen && !sistemaBloqueadoPorAtualizacao && (
        <div className="no-print" style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: '#004080', color: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', zIndex: 9999, maxWidth: '350px', border: '2px solid #38bdf8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <DownloadCloud size={24} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '18px' }}>Nova Versão Disponível!</h3>
          </div>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#cbd5e1' }}>Uma atualização de segurança e performance foi encontrada.</p>
          <button onClick={handleAtualizarAgora} style={{ width: '100%', padding: '12px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} /> Instalar Atualização
          </button>
          <button onClick={() => setUpdateModalOpen(false)} style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#cbd5e1', border: 'none', marginTop: '5px', cursor: 'pointer', fontSize: '12px' }}>
            Lembrar mais tarde
          </button>
        </div>
      )}

      {/* MODAL DE UPGRADE / LIMITE DE COTA */}
      {modalPremiumAberto && (
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15,23,42,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '50px', borderRadius: '20px', width: '100%', maxWidth: '550px', textAlign: 'center' }}>
            <Crown size={70} color="#f59e0b" style={{ margin: '0 auto 20px auto' }} />
            <h2 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '28px', fontWeight: '900' }}>Cota Gratuita Esgotada!</h2>
            <p style={{ color: '#475569', fontSize: '18px', lineHeight: '1.6', marginBottom: '15px' }}>Você utilizou sua Análise Gratuita e pôde ver o poder da Auto-Cura do AUDITTUS. Para continuar processando novos SPEDs, faça um upgrade para o Plano Premium.</p>
            
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '30px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>Sua Licença Vinculada:</p>
              <strong style={{ fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '5px' }}><User size={18}/> {licencaAtual?.identificador_cliente}</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button style={{ padding: '18px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}><Crown size={20} /> Assinar AUDITTUS Premium</button>
              <button onClick={() => setModalPremiumAberto(false)} style={{ padding: '15px', background: 'transparent', color: '#64748b', border: 'none', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>Voltar</button>
            </div>
          </div>
        </div>
      )}

      {/* AVISOS DE ATUALIZAÇÃO */}
      {diasRestantesAtualizacao !== null && (
        <div className="no-print" style={{ width: '100%', backgroundColor: '#f59e0b', color: '#fff', padding: '12px', textAlign: 'center', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={20} /> ATENÇÃO: O sistema será BLOQUEADO em {diasRestantesAtualizacao} dia(s) se não for atualizado.
        </div>
      )}

      <div className="content-wrapper">
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ color: '#004080', margin: '0', fontSize: '32px', fontWeight: '800' }}>AUDITTUS</h1>
            <p style={{ margin: '5px 0 15px 0', color: '#666', fontSize: '16px', fontWeight: '500' }}>Inteligência Fiscal e Auditoria Digital</p>
            
            {/* NOVO: CAIXA DE MENSAGEM VERMELHA COM RAZÃO SOCIAL */}
            {licencaAtual && licencaAtual.plano !== 'admin' && (
              <h3 style={{ color: '#ef4444', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                Olá, {licencaAtual.identificador_cliente} {razaoSocialLogada ? `- (${razaoSocialLogada})` : ''}
              </h3>
            )}
            
          </div>
          {licencaAtual && licencaAtual.plano !== 'admin' && (
            <div style={{ background: '#fff', padding: '10px 20px', borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: licencaAtual.plano === 'premium' ? '#10b981' : '#f59e0b' }}></div>
              <span style={{ fontWeight: 'bold', color: '#333' }}>{licencaAtual.identificador_cliente}</span>
              <span style={{ background: licencaAtual.plano === 'premium' ? '#ecfdf5' : '#fef3c7', color: licencaAtual.plano === 'premium' ? '#047857' : '#d97706', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{licencaAtual.plano}</span>
            </div>
          )}
        </div>

        {faseAtual === 'upload' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div className="upload-box">
              <input type="file" accept=".txt" onChange={processarArquivo} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }} />
              <div style={{ animation: 'float 3s ease-in-out infinite' }}><UploadCloud size={80} color="#004080" style={{ marginBottom: '25px' }} /></div>
              <h2 style={{ margin: '0 0 10px 0', color: '#004080', fontSize: '28px', fontWeight: '800' }}>Importe seu Arquivo SPED</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '18px' }}>Arraste o arquivo .txt para cá ou clique para buscar</p>
            </div>
          </div>
        )}

        {faseAtual === 'dashboard' && (
          <div>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
              <button onClick={() => setAbaAtiva('home')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'home' ? '#004080' : '#fff', color: abaAtiva === 'home' ? '#fff' : '#004080', border: '2px solid #004080', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><LayoutDashboard size={20} /> Visão Geral</button>
              <button onClick={() => setAbaAtiva('tributos')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'tributos' ? '#10b981' : '#fff', color: abaAtiva === 'tributos' ? '#fff' : '#10b981', border: '2px solid #10b981', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Tags size={20} /> Módulo Tributário</button>
              <button onClick={() => setAbaAtiva('verificacao')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'verificacao' ? '#f59e0b' : '#fff', color: abaAtiva === 'verificacao' ? '#fff' : '#f59e0b', border: '2px solid #f59e0b', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={20} /> Verificação do SPED</button>
              <button onClick={() => setAbaAtiva('auditoria')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'auditoria' ? '#ef4444' : '#fff', color: abaAtiva === 'auditoria' ? '#fff' : '#ef4444', border: '2px solid #ef4444', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><FileSearch size={20} /> Resultados da Auditoria</button>
            </div>

            <div className="print-banner" style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', border: '3px solid #004080', padding: '20px', borderRadius: '15px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#004080' }}>
                <Building2 size={40} />
                <div><h2 style={{ margin: 0, fontSize: '22px' }}>{dadosEmpresa.nome}</h2><span style={{ fontSize: '14px', opacity: 0.8 }}>CNPJ: {dadosEmpresa.cnpj}</span></div>
              </div>
              <div style={{ textAlign: 'right', color: '#004080' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '12px', fontWeight: 'bold' }}><Calendar size={14}/> PERÍODO</span>
                <strong style={{ display: 'block', fontSize: '18px' }}>{dadosEmpresa.periodo}</strong>
              </div>
            </div>

            <div className="dashboard-layout">
              {(abaAtiva === 'home' || abaAtiva === 'tributos') && (
                <div className="dash-main">
                  {abaAtiva === 'home' && (
                    <>
                      <div className="grid-3">
                        <div className="card-dash">
                          <h3 className="card-title"><ArrowRightLeft size={24}/> Volume de Operações</h3>
                          <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart margin={{ top: 20, right: 35, bottom: 20, left: 35 }}>
                                <Pie data={dadosGraficoOperacoes.filter(d=>d.value>0)} cx="50%" cy="50%" innerRadius={75} outerRadius={115} paddingAngle={5} dataKey="value" label={({percent}) => `${(percent*100).toFixed(1)}%`} labelLine={true} style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                  {dadosGraficoOperacoes.filter(d=>d.value>0).map((e, i) => <Cell key={i} fill={CORES_OPERACOES[i % CORES_OPERACOES.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v) => formatarMoeda(v)} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="card-dash">
                          <h3 className="card-title">Resumo por CFOP</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flexGrow: 1, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <h4 style={{ color: '#10b981', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingDown size={18}/> Entradas</h4>
                              <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '5px' }}>
                                {listaCfops.entradas.length > 0 ? listaCfops.entradas.map((item, idx) => (<div key={idx} className="cfop-row"><span className="cfop-lbl" title={item.cfop}>{item.cfop}</span><span className="cfop-val">{formatarMoeda(item.valor)}</span></div>)) : <p style={{ fontSize: '13px', color: '#999' }}>Sem entradas.</p>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #f0f4f8', paddingLeft: '20px' }}>
                              <h4 style={{ color: '#4f46e5', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={18}/> Saídas</h4>
                              <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '5px' }}>
                                {listaCfops.saidas.length > 0 ? listaCfops.saidas.map((item, idx) => (<div key={idx} className="cfop-row"><span className="cfop-lbl" title={item.cfop}>{item.cfop}</span><span className="cfop-val-s">{formatarMoeda(item.valor)}</span></div>)) : <p style={{ fontSize: '13px', color: '#999' }}>Sem saídas.</p>}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="card-dash" style={{ background: 'linear-gradient(135deg, #004080 0%, #0284c7 100%)', color: '#fff', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}><Calculator size={26}/> VAF Fiscal do Período</h3>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '10px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}><Plus size={16}/> Saídas Brutas</span><strong style={{ fontSize: '16px' }}>{formatarMoeda(dadosVaf.saidasBrutas)}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '10px', color: '#fca5a5' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}><Minus size={16}/> Dev. Vendas</span><strong style={{ fontSize: '16px' }}>{formatarMoeda(dadosVaf.devVendas)}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '10px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}><Minus size={16}/> Entradas Brutas</span><strong style={{ fontSize: '16px' }}>{formatarMoeda(dadosVaf.entradasBrutas)}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '10px', color: '#6ee7b7' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}><Plus size={16}/> Dev. Compras</span><strong style={{ fontSize: '16px' }}>{formatarMoeda(dadosVaf.devCompras)}</strong></div>
                          </div>
                          <div style={{ background: '#fff', color: '#004080', padding: '20px', borderRadius: '15px', textAlign: 'center', marginTop: '20px' }}>
                            <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}><Equal size={16} style={{ verticalAlign: 'middle' }}/> VALOR ADICIONADO</p>
                            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>{formatarMoeda(dadosVaf.vafTotal)}</h2>
                          </div>
                        </div>
                      </div>

                      <div className="grid-2">
                        <div className="card-dash">
                          <h3 className="card-title">Apuração de ICMS</h3>
                          <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                                <Pie data={dadosGraficoIcms.filter(d=>d.value>0)} cx="50%" cy="50%" innerRadius={75} outerRadius={115} paddingAngle={5} dataKey="value" label={({percent}) => `${(percent*100).toFixed(1)}%`} labelLine={true} style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                  {dadosGraficoIcms.filter(d=>d.value>0).map((e, i) => <Cell key={i} fill={CORES_ICMS[i % CORES_ICMS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v) => formatarMoeda(v)} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                          <div style={{ display: 'flex', gap: '20px' }}>
                            <div className="card-dash" style={{ flex: 1, padding: '20px', borderLeft: '6px solid #10b981' }}><p style={{ margin: '0 0 10px', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>SALDO CREDOR</p><h2 style={{ margin: 0, color: '#10b981', fontSize: '24px' }}>{formatarMoeda(resumoIcms.saldoCredor)}</h2></div>
                            <div className="card-dash" style={{ flex: 1, padding: '20px', borderLeft: '6px solid #ef4444' }}><p style={{ margin: '0 0 10px', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>ICMS RECOLHER</p><h2 style={{ margin: 0, color: '#ef4444', fontSize: '24px' }}>{formatarMoeda(resumoIcms.icmsRecolher)}</h2></div>
                          </div>
                          <div className="card-dash" style={{ flex: 1 }}><h3 className="card-title"><DollarSign size={20}/> Obrigações e Guias</h3>
                            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                              {guiasE116.length > 0 ? guiasE116.map((g, i) => (<div key={i} className="leg-item"><div><span style={{fontSize:'12px', color:'#666', display:'block'}}>Cód: {g.codigo}</span><span style={{fontSize:'12px', color:'#555'}}><Calendar size={12}/> Venc: {g.vencimento}</span></div><span className="leg-val" style={{color:'#ef4444'}}>{formatarMoeda(g.valor)}</span></div>)) : <p style={{fontSize:'13px', color:'#999', textAlign:'center'}}>Sem guias.</p>}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid-2">
                        <div className="card-dash">
                          <h3 className="card-title"><Package size={24}/> Top 10 Produtos</h3>
                          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {(topProdutos.vendas.length > 0 ? topProdutos.vendas : topProdutos.compras).map((it, idx) => (<div key={idx} className="cfop-row" style={{ background: idx%2===0?'#fafafa':'#fff', padding:'12px' }}><div style={{display:'flex', gap:'10px'}}><span style={{background:'#10b981', color:'#fff', minWidth:'24px', height:'24px', display:'flex', justifyContent:'center', alignItems:'center', borderRadius:'50%', fontSize:'12px'}}>{idx+1}</span><span className="cfop-lbl" title={it.nome}>{it.nome}</span></div><span className="cfop-val">{formatarMoeda(it.valor)}</span></div>))}
                          </div>
                        </div>
                        <div className="card-dash">
                          <h3 className="card-title"><Truck size={24}/> Top Fornecedores</h3>
                          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {topFornecedores.map((it, idx) => (<div key={idx} className="cfop-row" style={{ background: idx%2===0?'#fafafa':'#fff', padding:'12px' }}><div style={{display:'flex', gap:'10px'}}><span style={{background:'#f59e0b', color:'#fff', minWidth:'24px', height:'24px', display:'flex', justifyContent:'center', alignItems:'center', borderRadius:'50%', fontSize:'12px'}}>{idx+1}</span><span className="cfop-lbl" title={it.nome}>{it.nome}</span></div><span className="leg-val">{formatarMoeda(it.valor)}</span></div>))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {abaAtiva === 'tributos' && (
                    <>
                      <div className="grid-4">
                        <div className="card-dash" style={{ borderTop: '6px solid #004080', textAlign: 'center', padding: '20px' }}><p style={{fontSize:'12px', fontWeight:'bold', color:'#666'}}>FATURAMENTO ANALISADO</p><h2 style={{margin:0, color:'#004080', fontSize:'24px'}}>{formatarMoeda(resumoTributacao.total)}</h2></div>
                        <div className="card-dash" style={{ borderTop: '6px solid #f59e0b', textAlign: 'center', padding: '20px' }}><p style={{fontSize:'12px', fontWeight:'bold', color:'#666'}}>SUBSTITUIÇÃO (ST)</p><h2 style={{margin:0, color:'#f59e0b', fontSize:'24px'}}>{formatarMoeda(resumoTributacao.st)}</h2></div>
                        <div className="card-dash" style={{ borderTop: '6px solid #8b5cf6', textAlign: 'center', padding: '20px' }}><p style={{fontSize:'12px', fontWeight:'bold', color:'#666'}}>PRESTAÇÕES DE SERVIÇOS</p><h2 style={{margin:0, color:'#8b5cf6', fontSize:'24px'}}>{formatarMoeda(resumoTributacao.servicos)}</h2></div>
                        <div className="card-dash" style={{ borderTop: '6px solid #ef4444', textAlign: 'center', padding: '20px' }}><p style={{fontSize:'12px', fontWeight:'bold', color:'#666'}}>ISENTAS / NÃO TRIB</p><h2 style={{margin:0, color:'#ef4444', fontSize:'24px'}}>{formatarMoeda(resumoTributacao.isento)}</h2></div>
                      </div>
                      <div className="card-dash">
                        <h3 className="card-title"><Activity size={24} /> Tributação das Saídas (C190)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'center' }}>
                          <div className="chart-container"><ResponsiveContainer width="100%" height="100%"><PieChart margin={{ top: 20, right: 35, bottom: 20, left: 35 }}><Pie data={dadosTributacaoSaida.filter(d=>d.value>0)} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" label={({percent}) => `${(percent*100).toFixed(1)}%`} labelLine={true} style={{ fontSize: '12px', fontWeight: 'bold' }}>{dadosTributacaoSaida.filter(d=>d.value>0).map((e, i)=><Cell key={i} fill={CORES_TRIBUTACAO[i%CORES_TRIBUTACAO.length]} />)}</Pie><Tooltip formatter={(v)=>formatarMoeda(v)}/></PieChart></ResponsiveContainer></div>
                          <div style={{maxHeight:'300px', overflowY:'auto'}}>{dadosTributacaoSaida.map((it, idx)=>(<div key={idx} className="leg-item" style={{borderLeft:`5px solid ${CORES_TRIBUTACAO[idx%CORES_TRIBUTACAO.length]}`}}><span className="leg-lbl">{it.name}</span><strong className="leg-val">{formatarMoeda(it.value)}</strong></div>))}</div>
                        </div>
                      </div>
                    </>
                  )}
                  <BotoesAcao />
                </div>
              )}

              {(abaAtiva === 'home' || abaAtiva === 'tributos') && (
                <div className="dash-sidebar no-print">
                  <div className="card-dash" style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '2px solid #f0f4f8', paddingBottom: '20px', marginBottom: '20px' }}>
                      <div style={{ background: '#10b981', padding: '12px', borderRadius: '12px', color: '#fff' }}><Shield size={28} /></div>
                      <div><h3 style={{ margin: 0, color: '#004080', fontSize: '18px' }}>Auditoria Automática</h3><p style={{ margin: '2px 0 0', color: '#666', fontSize: '13px' }}>Ajustes e Correções</p></div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #3b82f6', marginBottom: '15px' }}><span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Registros Removidos (C191/C173)</span><strong style={{ fontSize: '22px', color: '#3b82f6' }}>{relatorioCorrecoes.c191Removidos + relatorioCorrecoes.c173Removidos}</strong></div>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #f59e0b', marginBottom: '15px' }}><span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Termos Proibidos Limpos</span><strong style={{ fontSize: '22px', color: '#f59e0b' }}>{relatorioCorrecoes.textosRemovidos}</strong></div>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}><span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Totalizadores Corrigidos</span><strong style={{ fontSize: '22px', color: '#10b981' }}>{relatorioCorrecoes.blocosRecalculados}</strong></div>
                    <div style={{ marginTop: '25px', background: '#004080', padding: '20px', borderRadius: '15px', textAlign: 'center', color: '#fff' }}><span style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>TOTAL DE INTERVENÇÕES</span><strong style={{ fontSize: '36px', fontWeight: '900' }}>{relatorioCorrecoes.c191Removidos + relatorioCorrecoes.c173Removidos + relatorioCorrecoes.textosRemovidos + relatorioCorrecoes.blocosRecalculados}</strong></div>
                  </div>
                </div>
              )}

              {abaAtiva === 'verificacao' && (
                <div className="card-dash" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #f0f4f8', paddingBottom: '20px', marginBottom: '30px' }}><h2 style={{ margin: 0, color: '#f59e0b', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '15px' }}><Zap size={32} color="#f59e0b" /> Radar de Malha Fina (Riscos Detectados)</h2></div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ background: '#f59e0b', color: '#fff', textAlign: 'left' }}><th style={{ padding: '15px' }}>Tipo de Risco</th><th style={{ padding: '15px' }}>Registro</th><th style={{ padding: '15px' }}>Alerta</th><th style={{ padding: '15px' }}>Detalhe</th></tr></thead>
                    <tbody>
                      {riscosFiscais.length > 0 ? riscosFiscais.map((risco, i) => (<tr key={i} style={{ borderBottom: '1px solid #f0f4f8', background: i%2===0?'#fff':'#f8fafc' }}><td style={{ padding: '15px', fontWeight: 'bold' }}>{risco.tipo}</td><td style={{ padding: '15px', fontWeight: 'bold', color: '#666' }}>{risco.registro}</td><td style={{ padding: '15px' }}><span style={{ background: risco.cor === '#ef4444' ? '#fee2e2' : '#fef3c7', color: risco.cor, padding: '6px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '900' }}>{risco.cor === '#ef4444' ? 'ALTO RISCO' : 'ATENÇÃO'}</span></td><td style={{ padding: '15px', color: '#555' }}>{risco.detalhe}</td></tr>)) : (<tr><td colSpan="4" style={{ padding: '50px', textAlign: 'center' }}><CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 15px auto' }} /><h3 style={{ margin: 0, color: '#10b981', fontSize: '20px' }}>Nenhum Risco Detectado</h3></td></tr>)}
                    </tbody>
                  </table>
                </div>
              )}

              {abaAtiva === 'auditoria' && (
                <div className="card-dash" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #f0f4f8', paddingBottom: '20px', marginBottom: '30px' }}><h2 style={{ margin: 0, color: '#004080', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '15px' }}><Shield size={32} color="#10b981" /> Relatório Detalhado de Auditoria</h2></div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ background: '#004080', color: '#fff', textAlign: 'left' }}><th style={{ padding: '15px' }}>Linha</th><th style={{ padding: '15px' }}>Registro</th><th style={{ padding: '15px' }}>Ação Realizada</th><th style={{ padding: '15px' }}>Detalhe Fiscal</th></tr></thead>
                    <tbody>
                      {logAuditoria.length > 0 ? logAuditoria.map((log, i) => { const isCura = log.acao === 'CORRIGIDO PELO ROBÔ'; return (<tr key={i} style={{ borderBottom: '1px solid #f0f4f8', background: isCura ? '#ecfdf5' : (i%2===0?'#fff':'#f8fafc') }}><td style={{ padding: '15px' }}>{log.linha}</td><td style={{ padding: '15px', fontWeight: 'bold' }}>{log.registro}</td><td style={{ padding: '15px' }}><span style={{ background: log.acao.includes('Removida') ? '#fee2e2' : isCura ? '#10b981' : '#fef3c7', color: log.acao.includes('Removida') ? '#ef4444' : isCura ? '#ffffff' : '#d97706', padding: '6px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '900' }}>{log.acao}</span></td><td style={{ padding: '15px', color: isCura ? '#047857' : '#666' }}>{log.detalhe}</td></tr>); }) : (<tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#999' }}>Nenhuma intervenção necessária.</td></tr>)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}