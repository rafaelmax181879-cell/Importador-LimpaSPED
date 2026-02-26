import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Download, DollarSign, Calendar, Building2, TrendingUp, TrendingDown, ArrowRightLeft, Printer, RefreshCw, Calculator, Plus, Minus, Equal, Shield, Package, Truck, LayoutDashboard, Tags, Activity, MapPin, AlertTriangle, FileSearch, Lock, Loader2, Zap, DownloadCloud, Crown, User, Sparkles } from 'lucide-react';

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
const SENHA_ADMIN = "Master9713"; 
const VERSAO_ATUAL = "1.1.27";

// Gerador de Hardware ID seguro
const obterOuGerarHardwareId = () => {
  let hwId = localStorage.getItem('audittus_hw_id');
  if (!hwId) {
    hwId = 'hw_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('audittus_hw_id', hwId);
  }
  return hwId;
};

// ==========================================
// FUNÇÕES FORMATADORAS GLOBAIS
// ==========================================
const formatarCNPJ = (cnpj) => {
  if (!cnpj) return '';
  const num = cnpj.replace(/\D/g, '');
  if (num.length === 14) return num.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return cnpj;
};

const formatarDataGuia = (dataStr) => {
  if (!dataStr || dataStr.length !== 8) return dataStr;
  return `${dataStr.substring(0,2)}/${dataStr.substring(2,4)}/${dataStr.substring(4,8)}`;
};

const getNomeGuia = (cod) => {
  const c = cod ? cod.toString().trim() : '';
  if (c === '1212') return '1212 - ICMS COMÉRCIO';
  if (c === '1112') return '1112 - ICMS INDÚSTRIA';
  if (c === '6307') return '6307 - FECOEP A RECOLHER';
  return c ? `${c} - CÓDIGO NÃO IDENTIFICADO` : 'CÓDIGO NÃO IDENTIFICADO';
};

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

// Formatador para os rótulos do PieChart não vazarem e mostrarem apenas a %
const renderCustomLabel = ({ percent }) => {
  if (percent < 0.02) return null; // Esconde labels de fatias muito pequenas
  return `${(percent * 100).toFixed(1)}%`;
};

export default function ImportadorSped() {
  const [faseAtual, setFaseAtual] = useState('splash'); 
  const [splashProgress, setSplashProgress] = useState(0); 

  const [senhaInput, setSenhaInput] = useState(''); 
  const [erroLogin, setErroLogin] = useState('');
  const [loadingText, setLoadingText] = useState('');
  const [isProcessandoLoading, setIsProcessandoLoading] = useState(false);
  
  const [licencaAtual, setLicencaAtual] = useState(null);
  const [modalPremiumAberto, setModalPremiumAberto] = useState(false);
  const [razaoSocialLogada, setRazaoSocialLogada] = useState(''); 

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

  const [updateNotification, setUpdateNotification] = useState(false);
  const [diasRestantesAtualizacao, setDiasRestantesAtualizacao] = useState(null);
  const [sistemaBloqueadoPorAtualizacao, setSistemaBloqueadoPorAtualizacao] = useState(false);

  // Efeito da Splash Screen (Idêntica à versão antiga)
  useEffect(() => {
    if (faseAtual === 'splash') {
      const interval = setInterval(() => {
        setSplashProgress((old) => {
          if (old >= 100) {
            clearInterval(interval);
            return 100;
          }
          return old + 2;
        });
      }, 60);

      const timer = setTimeout(() => { setFaseAtual('login'); }, 3000); 
      return () => { clearInterval(interval); clearTimeout(timer); };
    }
  }, [faseAtual]);

  useEffect(() => {
    window.triggerUpdateModal = () => setUpdateNotification(true);
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
    setUpdateNotification(false);
    setFaseAtual('loading');
    setLoadingText('Aplicando novas tecnologias... O sistema reiniciará em instantes.');
    if (window.require) window.require('electron').ipcRenderer.send('iniciar_atualizacao');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErroLogin('');
    const ident = senhaInput.trim();
    if (!ident) { setErroLogin('Por favor, informe seu E-mail ou CNPJ.'); return; }
    
    if (ident === SENHA_ADMIN) {
      setLicencaAtual({ plano: 'admin', identificador_cliente: 'Acesso Mestre' });
      setRazaoSocialLogada('Administrador');
      setFaseAtual('upload');
      return;
    }

    const mem = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    if (mem < 2 || cores < 2) {
      setErroLogin('Erro FATAL: Ambiente de execução gráfico não suportado.');
      return;
    }

    setIsProcessandoLoading(true);
    const hwId = obterOuGerarHardwareId();

    try {
      let razaoEncontrada = '';
      const apenasNumeros = ident.replace(/\D/g, '');
      if (apenasNumeros.length === 14) {
        try {
          const resApi = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${apenasNumeros}`);
          if (resApi.ok) {
            const dadosCnpj = await resApi.json();
            razaoEncontrada = dadosCnpj.razao_social.replace(/[()]/g, '').trim();
          }
        } catch (errApi) { console.log("Erro API CNPJ"); }
      }

      let { data: licenca, error } = await supabase.from('licencas_clientes').select('*').eq('identificador_cliente', ident).single();

      if (error && error.code !== 'PGRST116') { throw new Error("Erro de conexão."); }

      if (!licenca) {
        const novaLicenca = { identificador_cliente: ident, hardware_id: hwId, plano: 'trial', analises_gratuitas_restantes: 1, limite_cnpjs: 1, cnpjs_vinculados: [] };
        const { data: criada, error: errInsert } = await supabase.from('licencas_clientes').insert([novaLicenca]).select().single();
        if (errInsert) throw errInsert;
        licenca = criada;
      } else {
        if (!licenca.hardware_id) await supabase.from('licencas_clientes').update({ hardware_id: hwId }).eq('id', licenca.id);
        else if (licenca.hardware_id !== hwId) { setErroLogin('Licença vinculada a outro computador.'); setIsProcessandoLoading(false); return; }
      }

      if (licenca.status_bloqueio) { setErroLogin('Acesso bloqueado pelo administrador.'); setIsProcessandoLoading(false); return; }
      
      setRazaoSocialLogada(razaoEncontrada);
      setLicencaAtual(licenca);
      setFaseAtual('upload');
    } catch (err) { 
      setErroLogin('Erro de conexão com a nuvem.'); 
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
    setLoadingText("Lendo estrutura do arquivo SPED...");
    
    const reader = new FileReader();
    reader.readAsText(file, 'windows-1252');
    
    reader.onload = async (e) => {
      const conteudoArquivo = e.target.result;
      const linhasOriginais = conteudoArquivo.split(/\r?\n/);
      
      let cnpjArquivo = "";
      for (let i = 0; i < linhasOriginais.length; i++) {
        if (linhasOriginais[i].startsWith('|0000|')) { cnpjArquivo = linhasOriginais[i].split('|')[7]; break; }
      }

      if (licencaAtual && licencaAtual.plano !== 'admin') {
        if (licencaAtual.plano === 'trial') {
          if (licencaAtual.analises_gratuitas_restantes <= 0) { setFaseAtual('upload'); setModalPremiumAberto(true); return; }
          await supabase.from('licencas_clientes').update({ analises_gratuitas_restantes: 0 }).eq('id', licencaAtual.id);
          setLicencaAtual({...licencaAtual, analises_gratuitas_restantes: 0});
        } 
        else if (licencaAtual.plano === 'premium') {
          let listaCnpjs = licencaAtual.cnpjs_vinculados || [];
          if (!listaCnpjs.includes(cnpjArquivo)) {
            if (listaCnpjs.length >= licencaAtual.limite_cnpjs) {
              setFaseAtual('upload'); alert(`⛔ Limite Atingido!\nCNPJ do arquivo não faz parte da cota.`); return;
            } else {
              listaCnpjs.push(cnpjArquivo);
              await supabase.from('licencas_clientes').update({ cnpjs_vinculados: listaCnpjs }).eq('id', licencaAtual.id);
              setLicencaAtual({...licencaAtual, cnpjs_vinculados: listaCnpjs});
            }
          }
        }
      }

      setNomeOriginal(file.name);
      const mensagens = ["Lendo estrutura do arquivo SPED...", "Mapeando inteligência de CFOPs...", "Procurando Notas Puladas...", "Aplicando Auto-Cura...", "Gerando painéis modernos..."];
      let step = 0; setLoadingText(mensagens[0]);
      const inter = setInterval(() => { step++; if(step < mensagens.length) setLoadingText(mensagens[step]); }, 600);

      let linhasProcessadas = [];
      let contC191 = 0, contC173 = 0, contTextos = 0, logTemp = [], riscosTemp = [], numLinha = 0;
      let numDocAtual = 'S/N'; let notasPorSerie = {}; let mapNcm = {}; 
      const textosParaRemover = /\b(ISENTO|0000000|1111111|9999999|1500300|0300200|0300100|SEM GTIN|0500500|2003901|0300900|0301900|0112900|1800300)\b/gi;

      const mapUfIbgeLocal = { '11': 'Rondônia', '12': 'Acre', '13': 'Amazonas', '14': 'Roraima', '15': 'Pará', '16': 'Amapá', '17': 'Tocantins', '21': 'Maranhão', '22': 'Piauí', '23': 'Ceará', '24': 'Rio Grande do Norte', '25': 'Paraíba', '26': 'Pernambuco', '27': 'Alagoas', '28': 'Sergipe', '29': 'Bahia', '31': 'Minas Gerais', '32': 'Espírito Santo', '33': 'Rio de Janeiro', '35': 'São Paulo', '41': 'Paraná', '42': 'Santa Catarina', '43': 'Rio Grande do Sul', '50': 'Mato Grosso do Sul', '51': 'Mato Grosso', '52': 'Goiás', '53': 'Distrito Federal', '99': 'Exterior' };

      const cfopsEntradasBrutas = new Set(['1102','2102','3102','1117','2117','1403','2403','1101','2101','3101','1122','2122','1401','2401','1351','1352','1353','1354','1355','1356','2351','2352','2353','2354','2355','2356','3351','3352','3353','3354','3355','3356']);
      const cfopsSaidasBrutas = new Set(['5102','6102','7102','5115','6115','5403','6403','5405','5101','6101','7101','5113','6113','5401','6401','5117','6117','5351','6351','7351','5352','6352','7352','5353','6353','7353','5354','6354','7354','5355','6355','7355','5356','6356','7356','5357','6357','7357','5301','6301','7301','5302','6302','7302','5303','6303','7303','5304','6304','7304','5305','6305','7305','5306','6306','7306','5307','6307','7307','5251','6251','7251']);
      const cfopsDevVendas = new Set(['1202','2202','3202','1411','2411','1201','2201','3201','1410','2410','1206','2206','1207','2207']);
      const cfopsDevCompras = new Set(['5202','6202','7202','5411','6411','5201','6201','7201','5410','6410','5206','6206','5207','6207']);
      const cfopsNaoFaturamento = new Set(['5551','6551','7551','5552','6552','7552','5553','6553','7553','5554','6554','7554','5555','6555','7555','5556','6556','7556','5557','6557','7557','5661','6661','7661','5662','6662','7662','5663','6663','7663','5664','6664','7664','5665','6665','7665','5666','6666','7666','5201','6201','7201','5202','6202','7202','5206','6206','7206','5207','6207','7207','5410','6410','7410','5411','6411','7411','5926','5927']);

      let totalDeb = 0, totalCred = 0, tEnt = 0, tSai = 0, vafEnt = 0, vafSai = 0, vafDV = 0, vafDC = 0;
      let mCfopEnt = {}, mCfopSai = {}, listaAj = [], listaG = [], sCredFinal = 0, iRecFinal = 0;
      let mProd = {}, mPart = {}, mPartEst = {}, vProd = {}, cProd = {}, cForn = {}, opAt = ''; 
      let mTribSaida = {}, vST = 0, vServ = 0, vIse = 0, tAnalise = 0, cEstObj = {}; 
      let dEnt = { 'Revenda/Ind. - Tributadas': 0, 'Revenda/Ind. - Isentas': 0, 'Substituição Tributária (ST)': 0, 'Uso e Consumo': 0, 'Outras Entradas': 0 };

      linhasOriginais.forEach((linhaOriginal) => {
        numLinha++; let linha = linhaOriginal; let cols = linha.split('|');
        if (cols[1] === '0000') {
          const dtIni = cols[4]||''; const dtFin = cols[5]||'';
          setDadosEmpresa({ nome: cols[6]||'Empresa', cnpj: cols[7]||'', periodo: `${dtIni.substring(0,2)}/${dtIni.substring(2,4)}/${dtIni.substring(4,8)} a ${dtFin.substring(0,2)}/${dtFin.substring(2,4)}/${dtFin.substring(4,8)}` });
        }
        if (cols[1] === '0150') { mPart[cols[2]] = cols[3]; mPartEst[cols[2]] = cols[8] ? (mapUfIbgeLocal[cols[8].substring(0,2)] || 'Outros') : 'N/A'; }
        if (cols[1] === '0200') mProd[cols[2]] = cols[3];
        if (cols[1] === 'C100' || cols[1] === 'D100') {
           numDocAtual = cols[8] || 'S/N'; opAt = cols[2]; const vlD = parseFloat(cols[12]?.replace(',', '.')) || 0; 
           if (opAt === '0') { tEnt += vlD; if (cols[4]) { cForn[cols[4]] = (cForn[cols[4]] || 0) + vlD; cEstObj[mPartEst[cols[4]]] = (cEstObj[mPartEst[cols[4]]] || 0) + vlD; } } else if (opAt === '1') tSai += vlD; 
           if (cols[1] === 'C100') {
               const numNF = parseInt(cols[8], 10);
               if (cols[2] === '1' && cols[3] === '0' && !isNaN(numNF)) {
                   const key = `${cols[5]}-${cols[7]}`; if (!notasPorSerie[key]) notasPorSerie[key] = []; notasPorSerie[key].push(numNF);
               }
           }
        }
        if (cols[1] === 'C170') { const vlI = parseFloat(cols[7]?.replace(',', '.')) || 0; if (opAt === '1') vProd[cols[3]] = (vProd[cols[3]] || 0) + vlI; else if (opAt === '0') cProd[cols[3]] = (cProd[cols[3]] || 0) + vlI; }
        if (linha.startsWith('|C191|')) { contC191++; logTemp.push({ linha: numLinha, registro: `C191`, acao: 'Removida', detalhe: 'Registro C191 excluído.' }); return; }
        if (linha.startsWith('|C173|')) { contC173++; logTemp.push({ linha: numLinha, registro: `C173`, acao: 'Removida', detalhe: 'Registro C173 excluído.' }); return; }
        if (cols[1] === 'C190' || cols[1] === 'D190') {
          const cf = cols[3] || '', vlO = parseFloat(cols[5]?.replace(',', '.')) || 0, vlIc = parseFloat(cols[7]?.replace(',', '.')) || 0;
          if (cf.startsWith('1') || cf.startsWith('2') || cf.startsWith('3')) {
            mCfopEnt[cf] = (mCfopEnt[cf] || 0) + vlO;
            if (['1101','1102','2101','2102'].includes(cf)) vlIc > 0 ? dEnt['Revenda/Ind. - Tributadas'] += vlO : dEnt['Revenda/Ind. - Isentas'] += vlO;
            else if (cf.startsWith('14') || cf.startsWith('24')) dEnt['Substituição Tributária (ST)'] += vlO;
            else if (['1556','2556'].includes(cf)) dEnt['Uso e Consumo'] += vlO;
            else dEnt['Outras Entradas'] += vlO;
          } else {
            mCfopSai[cf] = (mCfopSai[cf] || 0) + vlO;
            if (!cfopsNaoFaturamento.has(cf)) {
              let cat = cf.startsWith('54') || cf.startsWith('64') ? 'Saídas ST' : vlIc === 0 ? 'Saídas Isentas' : 'Saídas Tributadas';
              if (cat === 'Saídas ST') vST += vlO; if (cat === 'Saídas Isentas') vIse += vlO;
              mTribSaida[cat] = (mTribSaida[cat] || 0) + vlO; tAnalise += vlO;
            }
          }
          if (cfopsEntradasBrutas.has(cf)) vafEnt += vlO; if (cfopsSaidasBrutas.has(cf)) vafSai += vlO; if (cfopsDevVendas.has(cf)) vafDV += vlO; if (cfopsDevCompras.has(cf)) vafDC += vlO; 
        }
        if (cols[1] === 'E110') { totalDeb = parseFloat(cols[2].replace(',', '.')) || 0; totalCred = parseFloat(cols[6].replace(',', '.')) || 0; iRecFinal = parseFloat(cols[13].replace(',', '.')) || 0; sCredFinal = parseFloat(cols[14].replace(',', '.')) || 0; }
        if (cols[1] === 'E116') listaG.push({ codigo: cols[2], valor: parseFloat(cols[3].replace(',', '.')) || 0, vencimento: cols[4] });
        const matches = linha.match(textosParaRemover);
        if (matches) { contTextos += matches.length; logTemp.push({ linha: numLinha, registro: cols[1], acao: 'Limpeza', detalhe: `Removido: ${matches.join(', ')}` }); linha = linha.replace(textosParaRemover, ''); }
        if (linha.trim() !== '') linhasProcessadas.push(linha);
      });

      Object.keys(notasPorSerie).forEach(key => {
        let nums = notasPorSerie[key].sort((a,b) => a - b);
        for (let i = 1; i < nums.length; i++) {
          if (nums[i] - nums[i-1] > 1) { riscosTemp.push({ tipo: 'NOTA FALTANTE', registro: `Mod/Série: ${key}`, cor: '#f59e0b', detalhe: `Buraco na numeração entre ${nums[i-1]} e ${nums[i]}.` }); break; }
        }
      });

      setListaCfops({ entradas: Object.keys(mCfopEnt).map(k=>({cfop:k, valor:mCfopEnt[k]})).sort((a,b)=>b.valor-a.valor), saidas: Object.keys(mCfopSai).map(k=>({cfop:k, valor:mCfopSai[k]})).sort((a,b)=>b.valor-a.valor) });
      setTopProdutos({ vendas: Object.keys(vProd).map(k=>({nome:mProd[k]||k, valor:vProd[k]})).sort((a,b)=>b.valor-a.valor).slice(0, 10), compras: Object.keys(cProd).map(k=>({nome:mProd[k]||k, valor:cProd[k]})).sort((a,b)=>b.valor-a.valor).slice(0, 10) });
      setTopFornecedores(Object.keys(cForn).map(k=>({nome:mPart[k]||k, valor:cForn[k]})).sort((a,b)=>b.valor-a.valor).slice(0, 5));
      setDadosEstados(Object.keys(cEstObj).map(k=>({name:k, value:cEstObj[k]})).sort((a,b)=>b.value-a.value));
      setDadosTributacaoSaida(Object.keys(mTribSaida).map(k=>({name:k, value:mTribSaida[k]})));
      setDadosRoscaEntradas(Object.keys(dEnt).map(k=>({name:k, value:dEnt[k]})));
      setDadosVaf({ entradasBrutas: vafEnt, saidasBrutas: vafSai, devVendas: vafDV, devCompras: vafDC, vafTotal: (vafSai - vafDV) - (vafEnt - vafDC) });
      setDadosGraficoIcms([{ name: 'Créditos', value: totalCred }, { name: 'Débitos', value: totalDeb }]);
      setDadosGraficoOperacoes([{ name: 'Total Entradas', value: tEnt }, { name: 'Total Saídas', value: tSai }]);
      setResumoIcms({ saldoCredor: sCredFinal, icmsRecolher: iRecFinal });
      setResumoTributacao({ st: vST, servicos: vServ, isento: vIse, total: tAnalise });
      setGuiasE116(listaG); setRiscosFiscais(riscosTemp); setLogAuditoria(logTemp);
      setRelatorioCorrecoes({ c191Removidos: contC191, c173Removidos: contC173, textosRemovidos: contTextos, blocosRecalculados: 3 });
      setArquivoProcessado(linhasProcessadas.join('\r\n')); 
      setTimeout(() => { clearInterval(inter); setFaseAtual('dashboard'); }, 3000);
    };
  };

  const aliquotaEfetiva = resumoTributacao.total > 0 ? ((resumoIcms.icmsRecolher / resumoTributacao.total) * 100).toFixed(2) : '0.00';

  const CORES_TRIBUTACAO = ['#004080', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
  const CORES_MAPA = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'];

  // =========================================================================
  // TELA 0: SPLASH SCREEN (EXATAMENTE COMO A IMAGEM ORIGINAL 1.1.0)
  // =========================================================================
  if (faseAtual === 'splash') {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' }}>
        <div style={{ width: '450px', padding: '50px 40px', textAlign: 'center' }}>
          <h1 style={{ color: '#ffffff', fontSize: '28px', margin: '0 0 10px 0', fontWeight: '900', letterSpacing: '1px', fontFamily: 'system-ui, sans-serif' }}>
            CORRETOR INTELIGENTE
          </h1>
          <h3 style={{ color: '#38bdf8', fontSize: '14px', margin: '0 0 40px 0', fontWeight: '400', letterSpacing: '3px', fontFamily: 'system-ui, sans-serif' }}>
            SPED FISCAL
          </h3>
          
          <div style={{ width: '100%', height: '4px', backgroundColor: '#334155', borderRadius: '2px', overflow: 'hidden', marginBottom: '15px' }}>
            <div style={{ width: `${splashProgress}%`, height: '100%', backgroundColor: '#06b6d4', transition: 'width 0.1s linear' }}></div>
          </div>
          
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 40px 0', fontFamily: 'system-ui, sans-serif' }}>
            Carregando módulos de auditoria...
          </p>
          <p style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 'bold', margin: 0, fontFamily: 'system-ui, sans-serif' }}>
            Versão {VERSAO_ATUAL}
          </p>
        </div>
        <style>{`body, html, #root { margin: 0; padding: 0; background: #1e293b; overflow: hidden; }`}</style>
      </div>
    );
  }

  // =========================================================================
  // BLOQUEIO DE SISTEMA OBSOLETO
  // =========================================================================
  if (sistemaBloqueadoPorAtualizacao) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#fff', padding: '50px', borderRadius: '20px', maxWidth: '500px', textAlign: 'center', borderTop: '8px solid #ef4444' }}>
          <AlertTriangle size={80} color="#ef4444" style={{ margin: '0 auto 20px' }} />
          <h1 style={{ color: '#ef4444', margin: '0 0 15px' }}>Sistema Obsoleto</h1>
          <p style={{ color: '#475569', fontSize: '18px', marginBottom: '20px' }}>O prazo de carência para a atualização expirou. É obrigatório instalar a nova atualização para continuar.</p>
          <button onClick={handleAtualizarAgora} style={{ width: '100%', padding: '15px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
            <DownloadCloud size={18} /> Forçar Atualização
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ESTRUTURA PRINCIPAL (CSS GLOBAL E DASHBOARD WIDESCREEN)
  // =========================================================================
  return (
    <div className="main-container">
      <style>{`
        /* FORÇANDO O LAYOUT A OCUPAR A TELA INTEIRA E CENTRALIZAR QUANDO NECESSÁRIO */
        body, html, #root { margin: 0; padding: 0; min-height: 100vh; width: 100vw; background: #f0f4f8; overflow-x: hidden; font-family: system-ui, sans-serif; }
        .main-container { flex: 1; width: 100%; min-height: 100vh; position: relative; }
        
        .update-bar { position: sticky; top: 0; z-index: 9999; background: #004080; color: #fff; padding: 12px; display: flex; align-items: center; justify-content: center; gap: 20px; animation: slideDown 0.5s ease; border-bottom: 3px solid #38bdf8; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        .btn-update { background: #38bdf8; color: #0f172a; border: none; padding: 8px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
        .btn-update:hover { background: #fff; transform: translateY(-1px); }
        
        /* CONTAINER DE CONTEÚDO LARGO (WIDESCREEN COMO O ORIGINAL) */
        .content-wrapper { width: 100%; max-width: 1600px; padding: 30px; margin: 0 auto; box-sizing: border-box; }
        
        .card-dash { background: #fff; padding: 25px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #e2e8f0; }
        .card-title { color: #004080; border-bottom: 2px solid #f0f4f8; padding-bottom: 15px; margin: 0 0 20px 0; font-size: 18px; display: flex; align-items: center; gap: 10px; font-weight: bold; }
        
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
        .grid-3 { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 25px; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        
        /* ANIMAÇÃO DA NUVEM */
        @keyframes flutuar { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
        .nuvem-animada { animation: flutuar 3s ease-in-out infinite; display: block; margin: 0 auto 25px; }
        
        .upload-box { width: 100%; max-width: 700px; padding: 60px 40px; border: 3px dashed #cbd5e1; border-radius: 24px; text-align: center; background: #fff; position: relative; transition: 0.3s; cursor: pointer; }
        .upload-box:hover { border-color: #004080; background: #f8fafc; transform: translateY(-2px); }
        
        .act-btns { display: flex; justify-content: center; gap: 20px; padding: 20px; background: #fff; border-radius: 16px; margin-top: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .btn-dl { background: #004080; color: #fff; border: none; padding: 15px 25px; border-radius: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.3s; }
        .btn-pr { background: #10b981; color: #fff; border: none; padding: 15px 25px; border-radius: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.3s; }
        .btn-nw { background: #ef4444; color: #fff; border: none; padding: 15px 25px; border-radius: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.3s; }
        .act-btns button:hover { opacity: 0.9; transform: translateY(-2px); }
        
        .cfop-row { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #f0f4f8; font-size: 14px; }
        .leg-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8fafc; border-radius: 10px; margin-bottom: 8px; }
        
        ::-webkit-scrollbar { width: 8px; height: 8px; } 
        ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; } 
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        
        @media print { .no-print { display: none !important; } }
      `}</style>

      {/* BARRA DE ATUALIZAÇÃO */}
      {updateNotification && (
        <div className="update-bar no-print">
          <Sparkles size={24} color="#38bdf8" />
          <span style={{ fontWeight: '600', fontSize: '15px' }}>Uma nova versão do AUDITTUS está disponível com melhorias de performance e segurança.</span>
          <button onClick={handleAtualizarAgora} className="btn-update">
            <RefreshCw size={18} /> Instalar e Reiniciar
          </button>
          <button onClick={() => setUpdateNotification(false)} style={{ background: 'transparent', color: '#cbd5e1', border: 'none', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>
            Lembrar depois
          </button>
        </div>
      )}

      {/* TELA DE LOGIN 100% CENTRALIZADA */}
      {faseAtual === 'login' && (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '50px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <Shield size={64} color="#004080" style={{ marginBottom: '20px' }} />
            <h1 style={{ color: '#004080', margin: '0 0 5px', fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>AUDITTUS</h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '30px' }}>Inteligência Fiscal e Auditoria Digital</p>
            
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <input 
                  type="text" 
                  placeholder="E-mail ou CNPJ da Licença" 
                  value={senhaInput} 
                  onChange={(e) => setSenhaInput(e.target.value)} 
                  style={{ width: '100%', boxSizing: 'border-box', padding: '15px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', textAlign: 'center', outline: 'none', transition: '0.3s' }} 
                />
                {erroLogin && <span style={{ color: '#ef4444', fontSize: '13px', display: 'block', marginTop: '8px', fontWeight: 'bold' }}>{erroLogin}</span>}
              </div>
              <button 
                type="submit" 
                disabled={isProcessandoLoading} 
                style={{ padding: '15px', background: '#004080', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: isProcessandoLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: '0.3s' }}
              >
                {isProcessandoLoading ? <Loader2 size={18} style={{ animation: 'spin 2s linear infinite' }} /> : <Lock size={18} />} 
                {isProcessandoLoading ? 'Validando Licença...' : 'Acessar Sistema'}
              </button>
            </form>
            <p style={{ marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>Se for o seu primeiro acesso, 1 análise será liberada gratuitamente.</p>
          </div>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* TELA DE LOADING (ENTRE PROCESSAMENTOS) CENTRALIZADA */}
      {faseAtual === 'loading' && (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '60px 80px', borderRadius: '24px', boxShadow: '0 25px 50px rgba(0,64,128,0.1)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', border: '2px solid #e2e8f0' }}>
            <div style={{ position: 'relative' }}>
              <Loader2 size={80} color="#004080" style={{ animation: 'spin 2s linear infinite' }} />
              <Zap size={30} color="#f59e0b" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            </div>
            <h2 style={{ color: '#004080', margin: '10px 0 0 0', fontSize: '28px', fontWeight: '900' }}>Processando Inteligência...</h2>
            <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '600', margin: 0, maxWidth: '280px', lineHeight: '1.4' }}>{loadingText}</p>
          </div>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* TELA DE UPLOAD 100% CENTRALIZADA */}
      {faseAtual === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', position: 'relative' }}>
          
          {/* SELO FIXADO NO TOPO ESQUERDO */}
          {licencaAtual && (
            <div className="no-print" style={{ position: 'absolute', top: '30px', left: '30px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '8px 16px', borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', zIndex: 50 }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: licencaAtual.plano === 'premium' ? '#10b981' : (licencaAtual.plano === 'admin' ? '#3b82f6' : '#f59e0b') }}></div>
              <span style={{ fontWeight: '900', color: '#333', fontSize: '14px', letterSpacing: '0.5px' }}>{formatarCNPJ(licencaAtual.identificador_cliente)}</span>
              <span style={{ background: licencaAtual.plano === 'premium' ? '#ecfdf5' : '#fef3c7', color: licencaAtual.plano === 'premium' ? '#047857' : '#d97706', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>{licencaAtual.plano}</span>
            </div>
          )}

          {/* CONTEÚDO ALINHADO NO CENTRO DO MONITOR */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h1 style={{ color: '#004080', margin: '0 0 5px 0', fontSize: '42px', fontWeight: '900', letterSpacing: '-1.5px' }}>AUDITTUS</h1>
              <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '18px', fontWeight: '500' }}>Inteligência Fiscal e Auditoria Digital</p>
              
              {/* SAUDAÇÃO MENOR E CENTRALIZADA ABAIXO DO TÍTULO */}
              {licencaAtual && licencaAtual.plano !== 'admin' && razaoSocialLogada && (
                <h3 style={{ color: '#ef4444', margin: '0', fontSize: '18px', fontWeight: 'bold' }}>Olá, {razaoSocialLogada}</h3>
              )}
            </div>
            
            <div className="upload-box">
              <input type="file" accept=".txt" onChange={processarArquivo} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }} />
              <UploadCloud size={80} color="#004080" className="nuvem-animada" />
              <h2 style={{ color: '#004080', margin: '0 0 10px 0', fontSize: '28px', fontWeight: '800' }}>Importe seu Arquivo SPED</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '18px' }}>Arraste o arquivo .txt para cá ou clique para buscar</p>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD PRINCIPAL (WIDESCREEN RESTAURADO) */}
      {faseAtual === 'dashboard' && (
        <div className="content-wrapper">
          
          <div className="no-print" style={{ marginBottom: '30px', position: 'relative' }}>
            {/* SELO NO TOPO ESQUERDO DO DASHBOARD TAMBÉM */}
            {licencaAtual && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '8px 16px', borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: licencaAtual.plano === 'premium' ? '#10b981' : (licencaAtual.plano === 'admin' ? '#3b82f6' : '#f59e0b') }}></div>
                <span style={{ fontWeight: '900', color: '#333', fontSize: '14px', letterSpacing: '0.5px' }}>{formatarCNPJ(licencaAtual.identificador_cliente)}</span>
                <span style={{ background: licencaAtual.plano === 'premium' ? '#ecfdf5' : '#fef3c7', color: licencaAtual.plano === 'premium' ? '#047857' : '#d97706', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>{licencaAtual.plano}</span>
              </div>
            )}
            <div>
              <h1 style={{ color: '#004080', margin: '0', fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>AUDITTUS</h1>
              <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '16px', fontWeight: '500' }}>Inteligência Fiscal e Auditoria Digital</p>
            </div>
          </div>

          <div className="no-print" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
            <button onClick={() => setAbaAtiva('home')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'home' ? '#004080' : '#fff', color: abaAtiva === 'home' ? '#fff' : '#004080', border: '2px solid #004080', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s' }}>
              <LayoutDashboard size={20} /> Visão Geral
            </button>
            <button onClick={() => setAbaAtiva('tributos')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'tributos' ? '#10b981' : '#fff', color: abaAtiva === 'tributos' ? '#fff' : '#10b981', border: '2px solid #10b981', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s' }}>
              <Tags size={20} /> Módulo Tributário
            </button>
            <button onClick={() => setAbaAtiva('verificacao')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'verificacao' ? '#f59e0b' : '#fff', color: abaAtiva === 'verificacao' ? '#fff' : '#f59e0b', border: '2px solid #f59e0b', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s' }}>
              <AlertTriangle size={20} /> Riscos Fiscais
            </button>
            <button onClick={() => setAbaAtiva('auditoria')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'auditoria' ? '#ef4444' : '#fff', color: abaAtiva === 'auditoria' ? '#fff' : '#ef4444', border: '2px solid #ef4444', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s' }}>
              <FileSearch size={20} /> Relatório de Auditoria
            </button>
          </div>

          <div className="print-banner card-dash" style={{ display: 'flex', justifyContent: 'space-between', borderLeft: '10px solid #004080', padding: '25px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#004080' }}>
              <Building2 size={40} />
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>{dadosEmpresa.nome}</h2>
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>CNPJ: {formatarCNPJ(dadosEmpresa.cnpj)}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', color: '#0f172a' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}><Calendar size={14}/> PERÍODO</span>
              <strong style={{ display: 'block', fontSize: '18px' }}>{dadosEmpresa.periodo}</strong>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ABA: HOME */}
          {/* ========================================================================= */}
          {abaAtiva === 'home' && (
            <>
              <div className="grid-3">
                <div className="card-dash">
                  <h3 className="card-title"><ArrowRightLeft size={20}/> Operações</h3>
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={dadosGraficoOperacoes} dataKey="value" innerRadius={60} outerRadius={85} paddingAngle={5} label={renderCustomLabel}>
                          {dadosGraficoOperacoes.map((e,i)=><Cell key={i} fill={CORES_TRIBUTACAO[i+1]}/>)}
                        </Pie>
                        <Tooltip formatter={v=>formatarMoeda(v)}/>
                        <Legend/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card-dash">
                  <h3 className="card-title">Resumo por CFOP (Top 6)</h3>
                  <div style={{ maxHeight: 250, overflowY: 'auto', paddingRight: '10px' }}>
                    {listaCfops.saidas.slice(0,6).map((it,idx)=>(
                      <div key={idx} className="cfop-row">
                        <span style={{ fontWeight: 'bold', color: '#64748b' }}>{it.cfop}</span>
                        <strong style={{ color: '#004080' }}>{formatarMoeda(it.valor)}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-dash" style={{ background: '#004080', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '15px' }}>VAF Fiscal do Período</h3>
                  <div style={{ fontSize: '38px', fontWeight: '900', marginBottom: '10px' }}>{formatarMoeda(dadosVaf.vafTotal)}</div>
                  <p style={{ margin: 0, opacity: 0.8, fontSize: '14px', fontWeight: '500' }}>Valor Adicionado Fiscal Estimado</p>
                </div>
              </div>

              <div className="grid-2">
                <div className="card-dash">
                  <h3 className="card-title">Apuração de ICMS</h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
                        <Pie data={dadosGraficoIcms} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={4} label={renderCustomLabel}>
                          {dadosGraficoIcms.map((e,i)=><Cell key={i} fill={i===0?'#004080':'#f59e0b'}/>)}
                        </Pie>
                        <Tooltip formatter={v=>formatarMoeda(v)}/>
                        <Legend/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card-dash">
                  <h3 className="card-title"><DollarSign size={20}/> Obrigações e Guias</h3>
                  <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '10px' }}>
                    {guiasE116.length > 0 ? guiasE116.map((g,i)=>(
                      <div key={i} className="leg-item" style={{ padding: '15px' }}>
                        <div>
                          <strong style={{ display: 'block', color: '#334155', marginBottom: '4px' }}>{getNomeGuia(g.codigo)}</strong>
                          <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12}/> Vencimento: {formatarDataGuia(g.vencimento)}</span>
                        </div>
                        <span style={{ color: '#ef4444', fontWeight: '900', fontSize: '16px' }}>{formatarMoeda(g.valor)}</span>
                      </div>
                    )) : <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '80px', fontSize: '16px', fontWeight: 'bold' }}>Nenhuma guia (E116) encontrada neste período.</p>}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* ABA: MÓDULO TRIBUTÁRIO */}
          {/* ========================================================================= */}
          {abaAtiva === 'tributos' && (
            <>
              <div className="grid-4">
                <div className="card-dash" style={{ borderTop: '6px solid #004080', textAlign: 'center', padding: '25px 15px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>FATURAMENTO ANALISADO</p>
                  <h2 style={{ margin: 0, color: '#004080', fontSize: '24px', fontWeight: '900' }}>{formatarMoeda(resumoTributacao.total)}</h2>
                </div>
                <div className="card-dash" style={{ borderTop: '6px solid #f59e0b', textAlign: 'center', padding: '25px 15px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>SUBSTITUIÇÃO (ST)</p>
                  <h2 style={{ margin: 0, color: '#f59e0b', fontSize: '24px', fontWeight: '900' }}>{formatarMoeda(resumoTributacao.st)}</h2>
                </div>
                <div className="card-dash" style={{ borderTop: '6px solid #8b5cf6', textAlign: 'center', padding: '25px 15px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>PRESTAÇÕES DE SERVIÇOS</p>
                  <h2 style={{ margin: 0, color: '#8b5cf6', fontSize: '24px', fontWeight: '900' }}>{formatarMoeda(resumoTributacao.servicos)}</h2>
                </div>
                <div className="card-dash" style={{ borderTop: '6px solid #ef4444', textAlign: 'center', padding: '25px 15px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>ISENTAS / NÃO TRIB</p>
                  <h2 style={{ margin: 0, color: '#ef4444', fontSize: '24px', fontWeight: '900' }}>{formatarMoeda(resumoTributacao.isento)}</h2>
                </div>
              </div>

              {/* CARD DE ALÍQUOTA EFETIVA IDÊNTICO AO SEU PRINT */}
              <div className="card-dash" style={{ background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '8px solid #004080', padding: '30px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px', color: '#004080', fontWeight: '900' }}>
                    <Calculator size={28}/> Alíquota Efetiva de Impostos
                  </h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
                    Percentual representativo da carga tributária a recolher com base no faturamento total analisado.
                  </p>
                </div>
                <div style={{ background: '#004080', color: '#fff', padding: '15px 35px', borderRadius: '12px', fontSize: '32px', fontWeight: '900', boxShadow: '0 10px 25px rgba(0,64,128,0.2)' }}>
                  {aliquotaEfetiva}%
                </div>
              </div>

              <div className="grid-2">
                <div className="card-dash">
                  <h3 className="card-title"><Activity size={24} /> Segregação das Entradas</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'center' }}>
                    <div style={{ height: 300 }}>
                      <ResponsiveContainer>
                        <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                          <Pie data={dadosRoscaEntradas} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={4} label={renderCustomLabel}>
                            {dadosRoscaEntradas.map((e,i)=><Cell key={i} fill={CORES_TRIBUTACAO[i%CORES_TRIBUTACAO.length]}/>)}
                          </Pie>
                          <Tooltip formatter={v=>formatarMoeda(v)}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{maxHeight:'280px', overflowY:'auto', paddingRight: '10px'}}>
                      {dadosRoscaEntradas.map((it, idx)=>(
                        <div key={idx} className="leg-item" style={{ borderLeft: `5px solid ${CORES_TRIBUTACAO[idx%CORES_TRIBUTACAO.length]}` }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{it.name}</span>
                          <strong style={{ fontSize: '14px', color: '#0f172a' }}>{formatarMoeda(it.value)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card-dash">
                  <h3 className="card-title"><Activity size={24} /> Tributação das Saídas</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'center' }}>
                    <div style={{ height: 300 }}>
                      <ResponsiveContainer>
                        <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                          <Pie data={dadosTributacaoSaida} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={4} label={renderCustomLabel}>
                            {dadosTributacaoSaida.map((e,i)=><Cell key={i} fill={CORES_TRIBUTACAO[i%CORES_TRIBUTACAO.length]}/>)}
                          </Pie>
                          <Tooltip formatter={v=>formatarMoeda(v)}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{maxHeight:'280px', overflowY:'auto', paddingRight: '10px'}}>
                      {dadosTributacaoSaida.map((it, idx)=>(
                        <div key={idx} className="leg-item" style={{ borderLeft: `5px solid ${CORES_TRIBUTACAO[idx%CORES_TRIBUTACAO.length]}` }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{it.name}</span>
                          <strong style={{ fontSize: '14px', color: '#0f172a' }}>{formatarMoeda(it.value)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* GRÁFICO DE ESTADOS (AQUISIÇÕES) */}
              <div className="card-dash">
                <h3 className="card-title"><MapPin size={24} /> Aquisições por Estado (Origem)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'center' }}>
                  <div style={{ height: 350 }}>
                    <ResponsiveContainer>
                      <PieChart margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
                        <Pie data={dadosEstados} dataKey="value" innerRadius={80} outerRadius={120} paddingAngle={4} label={renderCustomLabel}>
                          {dadosEstados.map((e,i)=><Cell key={i} fill={CORES_MAPA[i%CORES_MAPA.length]}/>)}
                        </Pie>
                        <Tooltip formatter={v=>formatarMoeda(v)}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{maxHeight:'320px', overflowY:'auto', paddingRight: '10px'}}>
                    {dadosEstados.map((it, idx)=>(
                      <div key={idx} className="leg-item" style={{ borderLeft: `6px solid ${CORES_MAPA[idx%CORES_MAPA.length]}`, padding: '15px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155' }}>{it.name}</span>
                        <strong style={{ fontSize: '18px', color: '#004080' }}>{formatarMoeda(it.value)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* ABA: RISCOS FISCAIS */}
          {/* ========================================================================= */}
          {abaAtiva === 'verificacao' && (
            <div className="card-dash">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px' }}>
                <h3 className="card-title" style={{ border: 'none', padding: 0, margin: 0 }}><AlertTriangle size={28} color="#f59e0b" /> Radar de Riscos Fiscais (Malha Fina)</h3>
                <button onClick={() => window.print()} className="btn-pr no-print" style={{ background: '#ef4444', margin: 0 }}>
                  <Printer size={18}/> Exportar em PDF
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f59e0b', color: '#fff', textAlign: 'left' }}>
                    <th style={{ padding: '15px', borderRadius: '10px 0 0 0' }}>Tipo de Risco</th>
                    <th style={{ padding: '15px' }}>Registro Afetado</th>
                    <th style={{ padding: '15px' }}>Alerta</th>
                    <th style={{ padding: '15px', borderRadius: '0 10px 0 0' }}>Detalhe e Orientação</th>
                  </tr>
                </thead>
                <tbody>
                  {riscosFiscais.length > 0 ? riscosFiscais.map((r,i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: i%2===0?'#fff':'#f8fafc' }}>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: '#334155' }}>{r.tipo}</td>
                      <td style={{ padding: '15px', color: '#64748b', fontWeight: '600' }}>{r.registro}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ background: r.cor, color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px' }}>ATENÇÃO</span>
                      </td>
                      <td style={{ padding: '15px', color: '#475569', lineHeight: '1.5' }}>{r.detalhe}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '60px', textAlign: 'center' }}>
                        <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 15px auto', display: 'block' }} />
                        <h3 style={{ margin: 0, color: '#10b981', fontSize: '24px' }}>Nenhum Risco Detectado no Arquivo!</h3>
                        <p style={{ color: '#64748b', marginTop: '10px' }}>A estrutura e as numerações aparentam estar íntegras.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA: RELATÓRIO DE AUDITORIA */}
          {/* ========================================================================= */}
          {abaAtiva === 'auditoria' && (
            <div className="card-dash">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px' }}>
                <h3 className="card-title" style={{ border: 'none', padding: 0, margin: 0 }}><Shield size={28} color="#10b981" /> Histórico de Intervenções (Auto-Cura)</h3>
                <button onClick={() => window.print()} className="btn-pr no-print" style={{ background: '#ef4444', margin: 0 }}>
                  <Printer size={18}/> Exportar em PDF
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#004080', color: '#fff', textAlign: 'left' }}>
                    <th style={{ padding: '15px', borderRadius: '10px 0 0 0' }}>Linha</th>
                    <th style={{ padding: '15px' }}>Registro</th>
                    <th style={{ padding: '15px' }}>Ação do Robô</th>
                    <th style={{ padding: '15px', borderRadius: '0 10px 0 0' }}>Detalhe Fiscal da Correção</th>
                  </tr>
                </thead>
                <tbody>
                  {logAuditoria.length > 0 ? logAuditoria.map((l,i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: i%2===0?'#fff':'#f8fafc' }}>
                      <td style={{ padding: '15px', color: '#64748b', fontWeight: 'bold' }}>{l.linha}</td>
                      <td style={{ padding: '15px', fontWeight: '900', color: '#004080' }}>{l.registro}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ background: '#ecfdf5', color: '#047857', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', border: '1px solid #10b981' }}>{l.acao}</span>
                      </td>
                      <td style={{ padding: '15px', color: '#475569', lineHeight: '1.5' }}>{l.detalhe}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                        <Shield size={64} color="#cbd5e1" style={{ margin: '0 auto 15px auto', display: 'block' }} />
                        <h3 style={{ margin: 0, color: '#64748b', fontSize: '20px' }}>Nenhuma intervenção corretiva foi necessária.</h3>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* BOTÕES DE AÇÃO GLOBAIS (RODAPÉ) */}
          <div className="act-btns no-print" style={{ marginBottom: '50px' }}>
            <button className="btn-dl" onClick={() => { 
              const b = new Blob([arquivoProcessado], { type: 'text/plain;charset=windows-1252' }); 
              const l = document.createElement('a'); 
              l.href = URL.createObjectURL(b); 
              l.download = `AUDITTUS_Curado_${nomeOriginal}`; 
              l.click(); 
            }}>
              <Download size={20} /> Baixar SPED Validado
            </button>
            <button className="btn-pr" onClick={() => window.print()}>
              <Printer size={20} /> Salvar Relatório (PDF)
            </button>
            <button className="btn-nw" onClick={limparDados}>
              <RefreshCw size={20} /> Nova Validação
            </button>
          </div>

        </div>
      )}
    </div>
  );
}