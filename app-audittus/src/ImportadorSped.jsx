import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Download, DollarSign, Calendar, Building2, TrendingUp, TrendingDown, ArrowRightLeft, Printer, RefreshCw, Calculator, Plus, Minus, Equal, Shield, Package, Truck, LayoutDashboard, Tags, Activity, MapPin, AlertTriangle, FileSearch, PieChart as PieChartIcon, Lock, Loader2, Zap, DownloadCloud } from 'lucide-react';

// ==========================================
// CONFIGURAÇÕES DO SISTEMA E VERSÃO
// ==========================================
const SENHA_ADMIN = "admin7474";
const SENHA_TESTE = "teste3478";
const TEMPO_TESTE_SEGUNDOS = 300; 
const VERSAO_ATUAL = "1.1.22";

export default function ImportadorSped() {
  // O sistema agora inicia direto no LOGIN (sem tela dupla de splash)
  const [faseAtual, setFaseAtual] = useState('login'); 
  const [senhaInput, setSenhaInput] = useState('');
  const [erroLogin, setErroLogin] = useState('');
  const [tipoAcesso, setTipoAcesso] = useState(null); 
  const [loadingText, setLoadingText] = useState('');

  const tempoSalvo = localStorage.getItem('audittus_trial_time');
  const tempoInicial = tempoSalvo !== null ? parseInt(tempoSalvo) : TEMPO_TESTE_SEGUNDOS;
  const [tempoRestante, setTempoRestante] = useState(tempoInicial);

  const [abaAtiva, setAbaAtiva] = useState('home'); 
  const [arquivoProcessado, setArquivoProcessado] = useState(null);
  const [nomeOriginal, setNomeOriginal] = useState('');
  
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
  const [dadosComparativoMensal, setDadosComparativoMensal] = useState([]);
  const [riscosFiscais, setRiscosFiscais] = useState([]);

  // ==========================================
  // INTELIGÊNCIA DE ATUALIZAÇÃO (UX REAL COM ELECTRON)
  // ==========================================
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [diasRestantesAtualizacao, setDiasRestantesAtualizacao] = useState(null);
  const [sistemaBloqueadoPorAtualizacao, setSistemaBloqueadoPorAtualizacao] = useState(false);

  useEffect(() => {
    window.triggerUpdateModal = () => setUpdateModalOpen(true);

    const ignoredDateStr = localStorage.getItem('audittus_update_ignored_date');
    if (ignoredDateStr) {
      const ignoredDate = new Date(ignoredDateStr);
      const hoje = new Date();
      const diffTime = Math.abs(hoje - ignoredDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const restantes = 10 - diffDays;

      if (restantes <= 0) {
        setSistemaBloqueadoPorAtualizacao(true);
      } else {
        setDiasRestantesAtualizacao(restantes);
      }
    }
    
    return () => { delete window.triggerUpdateModal; };
  }, []);

  const handleAtualizarAgora = () => {
    localStorage.removeItem('audittus_update_ignored_date'); 
    setDiasRestantesAtualizacao(null);
    setUpdateModalOpen(false);
    
    setFaseAtual('loading');
    setLoadingText('Baixando nova versão do servidor... O sistema reiniciará em breve.');
    
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('iniciar_atualizacao');
    }
  };

  const handleMaisTarde = () => {
    if (!localStorage.getItem('audittus_update_ignored_date')) {
      localStorage.setItem('audittus_update_ignored_date', new Date().toISOString());
      setDiasRestantesAtualizacao(10);
    }
    setUpdateModalOpen(false);
  };

  // ==========================================
  // CORES E MAPAS
  // ==========================================
  const CORES_ICMS = ['#004080', '#F59E0B']; 
  const CORES_OPERACOES = ['#10b981', '#4f46e5']; 
  const CORES_TRIBUTACAO = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
  const CORES_MAPA = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
  const CORES_ENTRADAS = ['#34d399', '#f87171', '#fbbf24', '#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#2dd4bf', '#94a3b8', '#818cf8', '#facc15'];

  const mapUfIbge = { '11': 'Rondônia', '12': 'Acre', '13': 'Amazonas', '14': 'Roraima', '15': 'Pará', '16': 'Amapá', '17': 'Tocantins', '21': 'Maranhão', '22': 'Piauí', '23': 'Ceará', '24': 'Rio Grande do Norte', '25': 'Paraíba', '26': 'Pernambuco', '27': 'Alagoas', '28': 'Sergipe', '29': 'Bahia', '31': 'Minas Gerais', '32': 'Espírito Santo', '33': 'Rio de Janeiro', '35': 'São Paulo', '41': 'Paraná', '42': 'Santa Catarina', '43': 'Rio Grande do Sul', '50': 'Mato Grosso do Sul', '51': 'Mato Grosso', '52': 'Goiás', '53': 'Distrito Federal', '99': 'Exterior' };

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  useEffect(() => {
    let intervalo;
    if (faseAtual === 'dashboard' && tipoAcesso === 'trial' && tempoRestante > 0) {
      intervalo = setInterval(() => {
        setTempoRestante(prev => {
          const novoTempo = prev - 1;
          localStorage.setItem('audittus_trial_time', novoTempo);
          return novoTempo;
        });
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [faseAtual, tipoAcesso, tempoRestante]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (senhaInput === SENHA_ADMIN) {
      setTipoAcesso('admin'); setFaseAtual('upload'); setErroLogin('');
    } else if (senhaInput === SENHA_TESTE) {
      if (tempoRestante <= 0) { setErroLogin('O período de teste já foi esgotado neste computador.'); return; }
      setTipoAcesso('trial'); setFaseAtual('upload'); setErroLogin('');
    } else {
      setErroLogin('Chave de acesso inválida.');
    }
  };

  const limparDados = () => {
    setFaseAtual('upload'); setArquivoProcessado(null); setNomeOriginal(''); setAbaAtiva('home');
    setDadosGraficoIcms([]); setAjustesICMS([]); setResumoIcms({ saldoCredor: 0, icmsRecolher: 0 });
    setGuiasE116([]); setDadosEmpresa({ nome: '', cnpj: '', periodo: '' }); setDadosGraficoOperacoes([]);
    setListaCfops({ entradas: [], saidas: [] }); setDadosVaf({ entradasBrutas: 0, saidasBrutas: 0, devVendas: 0, devCompras: 0, vafTotal: 0 });
    setRelatorioCorrecoes({ c191Removidos: 0, c173Removidos: 0, textosRemovidos: 0, blocosRecalculados: 0 });
    setTopProdutos({ vendas: [], compras: [] }); setTopFornecedores([]); setDadosTributacaoSaida([]);
    setResumoTributacao({ st: 0, servicos: 0, isento: 0, total: 0 }); setDadosEstados([]); setLogAuditoria([]); setDadosRoscaEntradas([]); setDadosComparativoMensal([]);
    setRiscosFiscais([]);
  };

  const processarArquivo = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setNomeOriginal(file.name);
    setFaseAtual('loading'); 
    
    const mensagens = ["Lendo estrutura do arquivo SPED...", "Mapeando inteligência de CFOPs...", "Procurando Notas Puladas e Erros de CST...", "Aplicando Auto-Cura Tributária...", "Gerando painel de Business Intelligence..."];
    let step = 0; setLoadingText(mensagens[0]);
    const inter = setInterval(() => { step++; if(step < mensagens.length) setLoadingText(mensagens[step]); }, 600);

    const reader = new FileReader();
    reader.readAsText(file, 'windows-1252');
    reader.onload = (e) => {
      const conteudoArquivo = e.target.result;
      const linhasOriginais = conteudoArquivo.split(/\r?\n/);
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
               const indOper = cols[2]; 
               const indEmit = cols[3]; 
               const mod = cols[5]; 
               const serie = cols[7];
               const numNF = parseInt(cols[8], 10);
               
               if (indOper === '1' && indEmit === '0' && (mod === '55' || mod === '65') && !isNaN(numNF)) {
                   const key = `${mod}-${serie}`;
                   if (!notasPorSerie[key]) notasPorSerie[key] = [];
                   notasPorSerie[key].push(numNF);
               }
           }
        }

        if (cols[1] === '0200') { mapNcm[cols[2]] = cols[8]; }

        if (cols[1] === 'C170') {
            const codItem = cols[3];
            const cst = cols[10];
            const cfop = cols[11];
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
                    cols[6] = '0,00'; 
                    cols[7] = '0,00'; 
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
              const mod = key.split('-')[0];
              const serie = key.split('-')[1];
              riscosTemp.push({ 
                  tipo: 'NUMERAÇÃO FALTANTE', 
                  registro: `Mod ${mod} - Série ${serie}`, 
                  cor: '#f59e0b', 
                  detalhe: `Faltam as Notas Fiscais: ${buracos.join(', ')}. Verificar Escrituração de Notas Canceladas ou Inutilizadas, para não Haver Notificações Futuras.` 
              });
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
      
      let dEnt = { 'Revenda/Ind. - Tributadas': 0, 'Revenda/Ind. - Isentas': 0, 'Substituição Tributária (ST)': 0, 'Uso e Consumo': 0, 'Ativo Imobilizado': 0, 'Bonificações': 0, 'Combustíveis': 0, 'Desagregação de Carnes': 0, 'Simples Remessa': 0, 'Transporte': 0, 'Energia Elétrica': 0, 'Retorno Imob.': 0, 'Outras Entradas': 0 };

      linhasProcessadas.forEach(linha => {
        const colunas = linha.split('|');
        if (colunas[1] === '0000') {
          const dtIni = colunas[4] ? colunas[4].trim() : ''; 
          const dtFin = colunas[5] ? colunas[5].trim() : '';
          let pFormatado = 'Período Indefinido';
          if (dtIni && dtFin) {
             pFormatado = (dtIni.length === 8 && dtFin.length === 8) ? `${dtIni.substring(0,2)}/${dtIni.substring(2,4)}/${dtIni.substring(4,8)} a ${dtFin.substring(0,2)}/${dtFin.substring(2,4)}/${dtFin.substring(4,8)}` : `${dtIni} a ${dtFin}`;
          } else if (dtIni) { pFormatado = dtIni; } else if (dtFin) { pFormatado = dtFin; }
          let c = colunas[7] || '';
          const cnpjFormatado = c.length === 14 ? `${c.substring(0,2)}.${c.substring(2,5)}.${c.substring(5,8)}/${c.substring(8,12)}-${c.substring(12,14)}` : c;
          setDadosEmpresa({ nome: colunas[6] || 'Razão Social Não Identificada', cnpj: cnpjFormatado, periodo: pFormatado });
        }
        
        if (colunas[1] === '0150') { mPart[colunas[2]] = colunas[3]; mPartEst[colunas[2]] = (colunas[4] && colunas[4] !== '01058') ? 'Exterior' : (colunas[8] ? (mapUfIbge[colunas[8].substring(0, 2)] || 'Outros') : 'N/A'); }
        if (colunas[1] === '0200') mProd[colunas[2]] = colunas[3]; 
        
        if (colunas[1] === 'C100') { 
            opAt = colunas[2]; 
            const vlD = parseFloat(colunas[12]?.replace(',', '.')) || 0; 
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
            else if (['1406','1551','2551'].includes(cf)) dEnt['Ativo Imobilizado'] += vlO;
            else if (['1910','2910'].includes(cf)) dEnt['Bonificações'] += vlO;
            else if (['1653','2653'].includes(cf)) dEnt['Combustíveis'] += vlO;
            else if (['1926','2926'].includes(cf)) dEnt['Desagregação de Carnes'] += vlO;
            else if (['1922','2922'].includes(cf)) dEnt['Simples Remessa'] += vlO;
            else if (['1252','1253','2252','2253'].includes(cf)) dEnt['Energia Elétrica'] += vlO;
            else if (['1554','2554'].includes(cf)) dEnt['Retorno Imob.'] += vlO;
            else if (cf.substring(1,3) === '35') dEnt['Transporte'] += vlO;
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
        if (colunas[1] === 'E111') listaAj.push({ codigo: colunas[2], descricao: colunas[2] === 'RO020003' ? 'ICMS Antecipado' : `Ajuste: ${colunas[2]}`, valor: parseFloat(colunas[4].replace(',', '.')) || 0 });
        if (colunas[1] === 'E116') listaG.push({ codigo: colunas[5] || colunas[2], valor: parseFloat(colunas[3].replace(',', '.')) || 0, vencimento: colunas[4] && colunas[4].length === 8 ? `${colunas[4].substring(0,2)}/${colunas[4].substring(2,4)}/${colunas[4].substring(4,8)}` : colunas[4] });
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

      setDadosComparativoMensal([
        { name: 'Vendas', value: vafSai, fill: '#10b981' }, { name: 'Compras', value: vafEnt, fill: '#3b82f6' }, { name: 'Dev. Vendas', value: vafDV, fill: '#ef4444' }, { name: 'Dev. Compras', value: vafDC, fill: '#f59e0b' }
      ].filter(item => item.value > 0)); 

      setRelatorioCorrecoes({ c191Removidos: contC191, c173Removidos: contC173, textosRemovidos: contTextos, blocosRecalculados: (contC191 > 0 || contC173 > 0) ? 3 : 0 });
      setLogAuditoria(logTemp); 
      setRiscosFiscais(riscosTemp);
      setArquivoProcessado(linhasProcessadas.join('\r\n')); 
      
      setTimeout(() => { clearInterval(inter); setFaseAtual('dashboard'); }, 3000);
    };
  };

  const BotoesAcao = () => (
    <div className="no-print act-btns">
        <button className="btn-dl" onClick={() => { const b = new Blob([arquivoProcessado], { type: 'text/plain;charset=windows-1252' }); const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = `AUDITTUS_Curado_${nomeOriginal}`; l.click(); }}><Download size={20} /> Baixar SPED Validado</button>
        <button className="btn-pr" onClick={() => window.print()}><Printer size={20} /> Salvar Relatório (PDF)</button>
        <button className="btn-nw" onClick={limparDados}><RefreshCw size={20} /> Nova Validação</button>
    </div>
  );

  const formatarTempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${seg.toString().padStart(2, '0')}`;
  };

  const temVendas = topProdutos.vendas && topProdutos.vendas.length > 0;
  const tituloTopProdutos = temVendas ? "Top 10 Produtos (Vendas)" : "Top 10 Produtos (Compras)";
  const listaExibicaoProdutos = temVendas ? topProdutos.vendas : topProdutos.compras;

  // ------------------------------------------------------------------------------------------------------------------
  // TELA DE BLOQUEIO DE SISTEMA (PÓS MAIS TARDE > 10 DIAS)
  // ------------------------------------------------------------------------------------------------------------------
  if (sistemaBloqueadoPorAtualizacao) {
    return (
      <div className="fullscreen-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="login-box" style={{ maxWidth: '500px', backgroundColor: '#fff', borderTop: '8px solid #ef4444' }}>
          <AlertTriangle size={80} color="#ef4444" style={{ margin: '0 auto 20px auto' }} />
          <h1 className="login-title" style={{ color: '#ef4444' }}>Sistema Obsoleto</h1>
          <p className="login-sub" style={{ fontSize: '18px', color: '#475569', lineHeight: '1.6', marginTop: '15px' }}>
            O prazo de carência para a atualização expirou. O uso desta versão foi bloqueado por motivos de segurança e alterações na legislação fiscal.<br/><br/>
            É obrigatório instalar a nova atualização para continuar utilizando o sistema.
          </p>
          <button onClick={handleAtualizarAgora} className="login-btn" style={{ width: '100%', marginTop: '20px', backgroundColor: '#ef4444' }}>
            <DownloadCloud size={18} /> Forçar Atualização Agora
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------------------------------------------------------
  // FASE 1 (NOVA): TELA DE LOGIN IMEDIATA (Sem segunda tela de carregamento)
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
              <input type="password" placeholder="Insira sua Chave de Acesso" value={senhaInput} onChange={(e) => setSenhaInput(e.target.value)} className="login-input" />
              {erroLogin && <span className="login-err">{erroLogin}</span>}
            </div>
            <button type="submit" className="login-btn"><Lock size={18} /> Acessar Sistema</button>
          </form>
        </div>
        <style>{`
          body, html, #root { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #f0f4f8; font-family: system-ui, sans-serif; }
          .fullscreen-center { display: flex; height: 100vh; width: 100vw; align-items: center; justify-content: center; }
          .login-box { background: #fff; padding: 50px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
          .login-title { margin: 0 0 5px 0; color: #004080; font-size: 32px; font-weight: 900; letter-spacing: -1px; }
          .login-sub { margin: 0 0 30px 0; color: #64748b; font-size: 14px; }
          .login-input { width: 100%; box-sizing: border-box; padding: 15px; border-radius: 12px; border: 2px solid #cbd5e1; font-size: 16px; outline: none; text-align: center; transition: 0.3s; }
          .login-input:focus { border-color: #004080; }
          .login-err { color: #ef4444; font-size: 12px; display: block; margin-top: 8px; font-weight: bold; }
          .login-btn { padding: 15px; background: #004080; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.3s; }
          .login-btn:hover { background: #003366; }
        `}</style>
      </div>
    );
  }

  // ------------------------------------------------------------------------------------------------------------------
  // FASE 2: TELA DE LOADING (A TELA BRANCA E LIMPA QUANDO IMPORTA O ARQUIVO)
  // ------------------------------------------------------------------------------------------------------------------
  if (faseAtual === 'loading') {
    return (
      <div className="fullscreen-center">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <Loader2 size={64} color="#004080" style={{ animation: 'spin 2s linear infinite' }} />
          <h2 style={{ color: '#004080', margin: 0, fontSize: '24px' }}>Processando SPED...</h2>
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '600' }}>{loadingText}</p>
          <style>{`
            body, html, #root { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #f0f4f8; font-family: system-ui, sans-serif; }
            .fullscreen-center { display: flex; height: 100vh; width: 100vw; align-items: center; justify-content: center; }
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------------------------------------------------------
  // DASHBOARD PRINCIPAL E MODAIS
  // ------------------------------------------------------------------------------------------------------------------
  return (
    <div className="main-container">
      <style>
        {`
          /* BASE: Ocupar 100% da tela sempre */
          body, html { margin: 0 !important; padding: 0 !important; width: 100% !important; min-height: 100vh !important; background-color: #f0f4f8 !important; }
          #root { width: 100% !important; min-height: 100vh !important; display: flex !important; flex-direction: column !important; max-width: none !important; padding: 0 !important; margin: 0 !important; }
          
          .main-container { flex: 1; width: 100%; padding: 0; box-sizing: border-box; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; }
          .content-wrapper { width: 100%; max-width: 1800px; padding: 30px; margin: 0 auto; display: flex; flex-direction: column; }

          /* O LAYOUT DE OURO: Grid 3 na Esquerda + Barra na Direita */
          .dashboard-layout { display: flex; gap: 30px; align-items: flex-start; width: 100%; }
          .dash-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 25px; }
          .dash-sidebar { width: 320px; flex-shrink: 0; position: sticky; top: 30px; }

          /* GRIDS ESPECÍFICOS PARA OS CARDS MANTENDO A PROPORÇÃO DA IMAGEM */
          .grid-3 { display: grid; grid-template-columns: 1fr 1.2fr 1.2fr; gap: 25px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
          .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
          
          /* COMPONENTES E UPLOAD PREMIUM */
          .card-dash { background: #fff; padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); display: flex; flex-direction: column; min-width: 0; }
          .card-title { color: #004080; border-bottom: 2px solid #f0f4f8; padding-bottom: 15px; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center; gap: 10px; }
          
          .upload-box { width: 100%; max-width: 800px; margin: 0 auto; padding: 80px 40px; background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%); border-radius: 24px; border: 3px dashed #cbd5e1; text-align: center; position: relative; transition: all 0.3s ease; box-shadow: 0 20px 40px rgba(0,0,0,0.03); }
          .upload-box:hover { border-color: #004080; transform: translateY(-5px); box-shadow: 0 25px 50px rgba(0,64,128,0.1); }
          .upload-icon { animation: float 3s ease-in-out infinite; opacity: 0.9; }
          @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }

          /* ESTRUTURAS DE TEXTO SEGURAS (NUNCA CORTA VALORES R$) */
          .cfop-row { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #f0f4f8; font-size: 14px; gap: 10px; }
          .cfop-lbl { font-weight: bold; color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .cfop-val { color: #10b981; font-weight: 600; white-space: nowrap; }
          .cfop-val-s { color: #4f46e5; font-weight: 600; white-space: nowrap; }
          
          .leg-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f8fafc; border-radius: 12px; margin-bottom: 8px; }
          .leg-lbl { font-size: 13px; color: #555; font-weight: 600; line-height: 1.2; }
          .leg-val { font-size: 14px; color: #004080; margin-left: 10px; font-weight: bold; white-space: nowrap; }

          /* PROTEÇÃO GRÁFICA CONTRA CORTES DA BIBLIOTECA (ALIQUOTAS PEQUENAS) */
          .recharts-wrapper { overflow: visible !important; }
          .chart-container { height: 300px; width: 100%; flex-grow: 1; }

          /* BOTOES */
          .act-btns { display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; padding: 20px; background: #fff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
          .act-btns button { padding: 15px 25px; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.3s; }
          .btn-dl { background: #004080; } .btn-pr { background: #10b981; } .btn-nw { background: #ef4444; }
          .act-btns button:hover { opacity: 0.8; }

          /* SCROLLBARS */
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
          ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

          /* RESPONSIVO DE TELA */
          @media (max-width: 1400px) { .grid-3 { grid-template-columns: 1fr 1fr; } .grid-4 { grid-template-columns: 1fr 1fr; } }
          @media (max-width: 1024px) { .dashboard-layout { flex-direction: column; } .dash-sidebar { width: 100%; position: static; } }
          @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }

          /* ================================================================================== */
          /* MODO DE IMPRESSÃO PDF: ISOLADO E 100% BLINDADO SEM QUEBRAR O LAYOUT DE TELA */
          /* ================================================================================== */
          @media print {
            @page { size: A4 portrait; margin: 15mm; } 
            .no-print, button { display: none !important; }
            
            body, html, .main-container, .content-wrapper { font-size: 14pt !important; background: #fff !important; margin: 0 !important; padding: 0 !important; width: 100% !important; display: block !important; }
            ::-webkit-scrollbar { display: none; }

            h1 { font-size: 36pt !important; margin-bottom: 10px !important; }
            h2 { font-size: 28pt !important; margin-bottom: 15px !important; }
            h3 { font-size: 22pt !important; margin-bottom: 20px !important; border-bottom-width: 3px !important; }
            
            /* Força a quebra de todas as colunas para o PDF */
            .dashboard-layout, .dash-main, .grid-3, .grid-2, .grid-4 { display: block !important; width: 100% !important; margin: 0 !important; }
            
            /* Cartões com Largura Fixa e Altura Dinâmica para não cortar listas */
            .card-dash, .dash-sidebar { width: 100% !important; max-width: 750px !important; height: auto !important; min-height: 0 !important; margin: 0 auto 30px auto !important; page-break-inside: avoid !important; box-shadow: none !important; border: 2px solid #cbd5e1 !important; padding: 35px !important; box-sizing: border-box !important; }
            
            .print-banner { width: 100% !important; max-width: 750px !important; margin: 0 auto 25px auto !important; border: 3px solid #004080 !important; background: #fff !important; color: #004080 !important; padding: 20px !important; box-sizing: border-box !important; display: flex !important; justify-content: space-between !important; }
            
            /* Remove limitações de scroll nas listas de impressão */
            div[style*="overflowY: auto"], div[style*="maxHeight: 250px"], div[style*="maxHeight: 280px"], div[style*="maxHeight: 300px"], div[style*="maxHeight: 350px"] { max-height: none !important; overflow: visible !important; height: auto !important; }
            
            /* Proteção máxima dos Gráficos no Papel */
            .chart-container { height: 400px !important; width: 100% !important; display: block !important; margin: 0 auto !important; page-break-inside: avoid !important; }
            .recharts-wrapper, .recharts-surface { overflow: visible !important; margin: 0 auto !important; }
          }
        `}
      </style>

      {/* MODAL DE ATUALIZAÇÃO (ACIONADO PELO ELECTRON/SISTEMA) */}
      {updateModalOpen && (
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '450px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
            <DownloadCloud size={64} color="#0ea5e9" style={{ margin: '0 auto 20px auto' }} />
            <h2 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '26px', fontWeight: '800' }}>Nova Atualização Disponível!</h2>
            <p style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.6', marginBottom: '30px' }}>Otimizações fiscais e novas regras da Receita foram adicionadas. Deseja atualizar o sistema agora?</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button onClick={handleMaisTarde} style={{ padding: '12px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: '0.3s' }}>Mais Tarde</button>
              <button onClick={handleAtualizarAgora} style={{ padding: '12px 20px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: '0.3s', boxShadow: '0 4px 15px rgba(14,165,233,0.3)' }}>Atualizar Agora</button>
            </div>
          </div>
        </div>
      )}

      {/* BANNER AVISO DE ATUALIZAÇÃO (APARECE SE CLICAR EM MAIS TARDE) */}
      {diasRestantesAtualizacao !== null && (
        <div className="no-print" style={{ width: '100%', backgroundColor: '#f59e0b', color: '#fff', padding: '12px 20px', textAlign: 'center', fontWeight: 'bold', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', zIndex: 50 }}>
          <AlertTriangle size={20} />
          ATENÇÃO: Uma nova atualização está pendente. O sistema será BLOQUEADO em {diasRestantesAtualizacao} dia(s). 
          <button onClick={() => setUpdateModalOpen(true)} style={{ marginLeft: '15px', padding: '5px 15px', background: '#fff', color: '#f59e0b', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>Atualizar Agora</button>
        </div>
      )}

      {/* CRONÔMETRO FLUTUANTE DE TESTE */}
      {tipoAcesso === 'trial' && tempoRestante > 0 && (
        <div className="no-print" style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: tempoRestante < 60 ? '#ef4444' : '#f59e0b', color: '#fff', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', zIndex: 9000, boxShadow: '0 4px 15px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} /> Modo Teste: {formatarTempo(tempoRestante)}
        </div>
      )}

      <div className="content-wrapper" style={{ filter: tempoRestante <= 0 && tipoAcesso === 'trial' ? 'blur(5px)' : 'none', transition: 'filter 0.5s' }}>
        
        <div className="no-print" style={{ textAlign: 'center', marginBottom: '30px', position: 'relative' }}>
          <h1 style={{ color: '#004080', margin: '0', fontSize: '32px', fontWeight: '800' }}>AUDITTUS</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '16px', fontWeight: '500' }}>Inteligência Fiscal e Auditoria Digital</p>
        </div>

        {faseAtual === 'upload' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '60vh' }}>
            <div className="upload-box">
              <input type="file" accept=".txt" onChange={processarArquivo} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }} />
              <div className="upload-icon"><UploadCloud size={80} color="#004080" style={{ marginBottom: '25px' }} /></div>
              <h2 style={{ margin: '0 0 10px 0', color: '#004080', fontSize: '28px', fontWeight: '800' }}>Importe seu Arquivo SPED</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '18px' }}>Arraste o arquivo .txt para cá ou clique para buscar no computador</p>
            </div>
          </div>
        )}

        {faseAtual === 'dashboard' && (
          <div>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
              <button onClick={() => setAbaAtiva('home')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'home' ? '#004080' : '#fff', color: abaAtiva === 'home' ? '#fff' : '#004080', border: '2px solid #004080', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}><LayoutDashboard size={20} /> Visão Geral</button>
              <button onClick={() => setAbaAtiva('tributos')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'tributos' ? '#10b981' : '#fff', color: abaAtiva === 'tributos' ? '#fff' : '#10b981', border: '2px solid #10b981', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}><Tags size={20} /> Módulo Tributário</button>
              <button onClick={() => setAbaAtiva('verificacao')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'verificacao' ? '#f59e0b' : '#fff', color: abaAtiva === 'verificacao' ? '#fff' : '#f59e0b', border: '2px solid #f59e0b', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}><AlertCircle size={20} /> Verificação do SPED</button>
              <button onClick={() => setAbaAtiva('auditoria')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'auditoria' ? '#ef4444' : '#fff', color: abaAtiva === 'auditoria' ? '#fff' : '#ef4444', border: '2px solid #ef4444', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}><FileSearch size={20} /> Resultados da Auditoria</button>
            </div>

            <div className="print-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Building2 size={40} />
                <div><h2 style={{ margin: 0, fontSize: '22px' }}>{dadosEmpresa.nome}</h2><span style={{ fontSize: '14px', opacity: 0.8 }}>CNPJ: {dadosEmpresa.cnpj}</span></div>
              </div>
              <div style={{ textAlign: 'right', backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '12px', opacity: 0.8 }}><Calendar size={14}/> PERÍODO</span>
                <strong style={{ display: 'block', fontSize: '18px' }}>{dadosEmpresa.periodo}</strong>
              </div>
            </div>

            <div className="dashboard-layout">
              
              {/* PAINEL CENTRAL (HOME OU TRIBUTOS) */}
              {(abaAtiva === 'home' || abaAtiva === 'tributos') && (
                <div className="dash-main">
                  
                  {/* ABA: VISÃO GERAL */}
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
                                {listaCfops.entradas.length > 0 ? listaCfops.entradas.map((item, idx) => (
                                  <div key={idx} className="cfop-row"><span className="cfop-lbl" title={item.cfop}>{item.cfop}</span><span className="cfop-val">{formatarMoeda(item.valor)}</span></div>
                                )) : <p style={{ fontSize: '13px', color: '#999' }}>Sem entradas.</p>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #f0f4f8', paddingLeft: '20px' }}>
                              <h4 style={{ color: '#4f46e5', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={18}/> Saídas</h4>
                              <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '5px' }}>
                                {listaCfops.saidas.length > 0 ? listaCfops.saidas.map((item, idx) => (
                                  <div key={idx} className="cfop-row"><span className="cfop-lbl" title={item.cfop}>{item.cfop}</span><span className="cfop-val-s">{formatarMoeda(item.valor)}</span></div>
                                )) : <p style={{ fontSize: '13px', color: '#999' }}>Sem saídas.</p>}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="card-dash" style={{ background: 'linear-gradient(135deg, #004080 0%, #0284c7 100%)', color: '#fff', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}><Calculator size={26}/> VAF Fiscal do Período</h3>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '10px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}><Plus size={16}/> Saídas Brutas</span><strong style={{ fontSize: '16px', whiteSpace: 'nowrap' }}>{formatarMoeda(dadosVaf.saidasBrutas)}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '10px', color: '#fca5a5' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}><Minus size={16}/> Dev. Vendas</span><strong style={{ fontSize: '16px', whiteSpace: 'nowrap' }}>{formatarMoeda(dadosVaf.devVendas)}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '10px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}><Minus size={16}/> Entradas Brutas</span><strong style={{ fontSize: '16px', whiteSpace: 'nowrap' }}>{formatarMoeda(dadosVaf.entradasBrutas)}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '10px', color: '#6ee7b7' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}><Plus size={16}/> Dev. Compras</span><strong style={{ fontSize: '16px', whiteSpace: 'nowrap' }}>{formatarMoeda(dadosVaf.devCompras)}</strong></div>
                          </div>
                          <div style={{ background: '#fff', color: '#004080', padding: '20px', borderRadius: '15px', textAlign: 'center', marginTop: '20px' }}>
                            <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}><Equal size={16} style={{ verticalAlign: 'middle' }}/> VALOR ADICIONADO</p>
                            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', whiteSpace: 'nowrap' }}>{formatarMoeda(dadosVaf.vafTotal)}</h2>
                          </div>
                          {dadosVaf.vafTotal < 0 && <div style={{ position: 'absolute', bottom: '-40px', left: 0, right: 0, textAlign: 'center' }}><span style={{ background: '#fee2e2', color: '#ef4444', padding: '6px 15px', borderRadius: '20px', fontWeight: 'bold' }}><AlertTriangle size={18} /> ATENÇÃO! VAF Negativo</span></div>}
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
                            <div className="card-dash" style={{ flex: 1, padding: '20px', borderLeft: '6px solid #10b981' }}><p style={{ margin: '0 0 10px', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>SALDO CREDOR</p><h2 style={{ margin: 0, color: '#10b981', fontSize: '24px', whiteSpace: 'nowrap' }}>{formatarMoeda(resumoIcms.saldoCredor)}</h2></div>
                            <div className="card-dash" style={{ flex: 1, padding: '20px', borderLeft: '6px solid #ef4444' }}><p style={{ margin: '0 0 10px', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>ICMS RECOLHER</p><h2 style={{ margin: 0, color: '#ef4444', fontSize: '24px', whiteSpace: 'nowrap' }}>{formatarMoeda(resumoIcms.icmsRecolher)}</h2></div>
                          </div>
                          <div className="card-dash" style={{ flex: 1 }}><h3 className="card-title"><DollarSign size={20}/> Obrigações e Guias</h3>
                            <div style={{ maxHeight: '150px', overflowY: 'auto', paddingRight: '5px' }}>
                              {guiasE116.length > 0 ? guiasE116.map((g, i) => (<div key={i} className="leg-item"><div><span style={{fontSize:'12px', color:'#666', display:'block'}}>Cód: {g.codigo}</span><span style={{fontSize:'12px', color:'#555'}}><Calendar size={12}/> Venc: {g.vencimento}</span></div><span className="leg-val" style={{color:'#ef4444'}}>{formatarMoeda(g.valor)}</span></div>)) : <p style={{fontSize:'13px', color:'#999', textAlign:'center'}}>Sem guias.</p>}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid-2">
                        <div className="card-dash">
                          <h3 className="card-title"><Package size={24}/> {tituloTopProdutos}</h3>
                          <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                            {listaExibicaoProdutos.length > 0 ? listaExibicaoProdutos.map((it, idx) => (
                              <div key={idx} className="cfop-row" style={{ background: idx%2===0?'#fafafa':'#fff', borderRadius:'8px', padding:'12px' }}>
                                <div style={{display:'flex', alignItems:'center', gap:'10px', overflow:'hidden'}}><span style={{background:'#10b981', color:'#fff', minWidth:'24px', height:'24px', display:'flex', justifyContent:'center', alignItems:'center', borderRadius:'50%', fontSize:'12px', fontWeight:'bold'}}>{idx+1}</span><span className="cfop-lbl" title={it.nome}>{it.nome}</span></div><span className="cfop-val">{formatarMoeda(it.valor)}</span>
                              </div>
                            )) : <p style={{fontSize:'13px', color:'#999', textAlign:'center'}}>Sem produtos.</p>}
                          </div>
                        </div>
                        <div className="card-dash">
                          <h3 className="card-title"><Truck size={24}/> Top Fornecedores</h3>
                          <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                            {topFornecedores.length > 0 ? topFornecedores.map((it, idx) => (
                              <div key={idx} className="cfop-row" style={{ background: idx%2===0?'#fafafa':'#fff', borderRadius:'8px', padding:'12px' }}>
                                <div style={{display:'flex', alignItems:'center', gap:'10px', overflow:'hidden'}}><span style={{background:'#f59e0b', color:'#fff', minWidth:'24px', height:'24px', display:'flex', justifyContent:'center', alignItems:'center', borderRadius:'50%', fontSize:'12px', fontWeight:'bold'}}>{idx+1}</span><span className="cfop-lbl" title={it.nome}>{it.nome}</span></div><span className="leg-val">{formatarMoeda(it.valor)}</span>
                              </div>
                            )) : <p style={{fontSize:'13px', color:'#999', textAlign:'center'}}>Sem fornecedores.</p>}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ABA: TRIBUTOS */}
                  {abaAtiva === 'tributos' && (
                    <>
                      <div className="grid-4">
                        <div className="card-dash" style={{ borderTop: '6px solid #004080', textAlign: 'center', padding: '20px' }}><p style={{fontSize:'12px', fontWeight:'bold', color:'#666'}}>FATURAMENTO ANALISADO</p><h2 style={{margin:0, color:'#004080', fontSize:'24px', whiteSpace:'nowrap'}}>{formatarMoeda(resumoTributacao.total)}</h2></div>
                        <div className="card-dash" style={{ borderTop: '6px solid #f59e0b', textAlign: 'center', padding: '20px' }}><p style={{fontSize:'12px', fontWeight:'bold', color:'#666'}}>SUBSTITUIÇÃO (ST)</p><h2 style={{margin:0, color:'#f59e0b', fontSize:'24px', whiteSpace:'nowrap'}}>{formatarMoeda(resumoTributacao.st)}</h2></div>
                        <div className="card-dash" style={{ borderTop: '6px solid #8b5cf6', textAlign: 'center', padding: '20px' }}><p style={{fontSize:'12px', fontWeight:'bold', color:'#666'}}>PRESTAÇÕES DE SERVIÇOS</p><h2 style={{margin:0, color:'#8b5cf6', fontSize:'24px', whiteSpace:'nowrap'}}>{formatarMoeda(resumoTributacao.servicos)}</h2></div>
                        <div className="card-dash" style={{ borderTop: '6px solid #ef4444', textAlign: 'center', padding: '20px' }}><p style={{fontSize:'12px', fontWeight:'bold', color:'#666'}}>ISENTAS / NÃO TRIB</p><h2 style={{margin:0, color:'#ef4444', fontSize:'24px', whiteSpace:'nowrap'}}>{formatarMoeda(resumoTributacao.isento)}</h2></div>
                      </div>

                      <div className="card-dash">
                        <h3 className="card-title"><Activity size={24} /> Tributação das Saídas (C190)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'center' }}>
                          <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 20, right: 35, bottom: 20, left: 35 }}>
                                    <Pie data={dadosTributacaoSaida.filter(d=>d.value>0)} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" label={({percent}) => `${(percent*100).toFixed(1)}%`} labelLine={true} style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                        {dadosTributacaoSaida.filter(d=>d.value>0).map((e, i)=><Cell key={i} fill={CORES_TRIBUTACAO[i%CORES_TRIBUTACAO.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v)=>formatarMoeda(v)}/>
                                </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div style={{maxHeight:'300px', overflowY:'auto', paddingRight:'10px'}}>{dadosTributacaoSaida.map((it, idx)=>(<div key={idx} className="leg-item" style={{borderLeft:`5px solid ${CORES_TRIBUTACAO[idx%CORES_TRIBUTACAO.length]}`}}><span className="leg-lbl">{it.name}</span><strong className="leg-val">{formatarMoeda(it.value)}</strong></div>))}</div>
                        </div>
                      </div>

                      <div className="grid-2">
                        <div className="card-dash">
                          <h3 className="card-title"><MapPin size={24} /> Aquisições por Estado</h3>
                          <div className="chart-container">
                              <ResponsiveContainer width="100%" height="100%">
                                  <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                                      <Pie data={dadosEstados.filter(d=>d.value>0)} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" label={({percent}) => `${(percent*100).toFixed(1)}%`} labelLine={true} style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                          {dadosEstados.filter(d=>d.value>0).map((e, i)=><Cell key={i} fill={CORES_MAPA[i%CORES_MAPA.length]} />)}
                                      </Pie>
                                      <Tooltip formatter={(v)=>formatarMoeda(v)}/>
                                  </PieChart>
                              </ResponsiveContainer>
                          </div>
                          <div style={{maxHeight:'250px', overflowY:'auto', marginTop:'20px', paddingRight:'5px'}}>{dadosEstados.map((it, idx)=>(<div key={idx} className="leg-item" style={{borderLeft:`5px solid ${CORES_MAPA[idx%CORES_MAPA.length]}`}}><span className="leg-lbl">{it.name}</span><strong className="leg-val">{formatarMoeda(it.value)}</strong></div>))}</div>
                        </div>

                        <div className="card-dash">
                          <h3 className="card-title"><Package size={24}/> Divisão de Entradas</h3>
                          <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                                    <Pie data={dadosRoscaEntradas.filter(d=>d.value>0)} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" label={({percent}) => `${(percent*100).toFixed(1)}%`} labelLine={true} style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                        {dadosRoscaEntradas.filter(d=>d.value>0).map((e, i)=><Cell key={i} fill={CORES_ENTRADAS[i%CORES_ENTRADAS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v)=>formatarMoeda(v)}/>
                                </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div style={{maxHeight:'250px', overflowY:'auto', marginTop:'20px', paddingRight:'5px'}}>
                            {dadosRoscaEntradas.map((it, idx)=>(<div key={idx} className="leg-item" style={{borderLeft:`5px solid ${CORES_ENTRADAS[idx%CORES_ENTRADAS.length]}`}}><span className="leg-lbl">{it.name}</span><strong className="leg-val">{formatarMoeda(it.value)}</strong></div>))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <BotoesAcao />
                </div>
              )}

              {/* BARRA LATERAL FIXA DA DIREITA (O SEGREDO DO LAYOUT DE OURO) */}
              {(abaAtiva === 'home' || abaAtiva === 'tributos') && (
                <div className="dash-sidebar no-print">
                  <div className="card-dash" style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '2px solid #f0f4f8', paddingBottom: '20px', marginBottom: '20px' }}>
                      <div style={{ background: '#10b981', padding: '12px', borderRadius: '12px', color: '#fff' }}><Shield size={28} /></div>
                      <div><h3 style={{ margin: 0, color: '#004080', fontSize: '18px' }}>Auditoria Automática</h3><p style={{ margin: '2px 0 0', color: '#666', fontSize: '13px' }}>Ajustes e Correções</p></div>
                    </div>
                    
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #3b82f6', marginBottom: '15px' }}>
                      <span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Registros Removidos (C191/C173)</span><strong style={{ fontSize: '22px', color: '#3b82f6' }}>{relatorioCorrecoes.c191Removidos + relatorioCorrecoes.c173Removidos}</strong>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #f59e0b', marginBottom: '15px' }}>
                      <span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Termos Proibidos Limpos</span><strong style={{ fontSize: '22px', color: '#f59e0b' }}>{relatorioCorrecoes.textosRemovidos}</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: '#999', marginTop: '4px' }}>Ex: ISENTO, Zeros, Sem GTIN</span>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                      <span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Totalizadores Corrigidos</span><strong style={{ fontSize: '22px', color: '#10b981' }}>{relatorioCorrecoes.blocosRecalculados}</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: '#999', marginTop: '4px' }}>C990, 9990, 9999</span>
                    </div>
                    <div style={{ marginTop: '25px', background: '#004080', padding: '20px', borderRadius: '15px', textAlign: 'center', color: '#fff' }}>
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>TOTAL DE INTERVENÇÕES</span><strong style={{ fontSize: '36px', fontWeight: '900' }}>{relatorioCorrecoes.c191Removidos + relatorioCorrecoes.c173Removidos + relatorioCorrecoes.textosRemovidos + relatorioCorrecoes.blocosRecalculados}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* NOVA ABA: VERIFICAÇÃO DO SPED (TABELA EXECUTIVA DE RISCOS E MALHA FINA) */}
              {abaAtiva === 'verificacao' && (
                <div className="card-dash" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #f0f4f8', paddingBottom: '20px', marginBottom: '30px' }}>
                    <h2 style={{ margin: 0, color: '#f59e0b', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '15px' }}><Zap size={32} color="#f59e0b" /> Radar de Malha Fina (Riscos Detectados)</h2>
                    <button className="no-print btn-pr" onClick={() => window.print()}><Printer size={18}/> Salvar PDF</button>
                  </div>
                  
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f59e0b', color: '#fff', textAlign: 'left' }}>
                        <th style={{ padding: '15px' }}>Tipo de Risco</th><th style={{ padding: '15px' }}>Registro / Documento</th><th style={{ padding: '15px' }}>Nível de Alerta</th><th style={{ padding: '15px' }}>Detalhe da Infração</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riscosFiscais.length > 0 ? riscosFiscais.map((risco, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f0f4f8', background: i%2===0?'#fff':'#f8fafc' }}>
                          <td style={{ padding: '15px', fontWeight: 'bold', color: '#333' }}>{risco.tipo}</td>
                          <td style={{ padding: '15px', fontWeight: 'bold', color: '#666' }}>{risco.registro}</td>
                          <td style={{ padding: '15px' }}>
                            <span style={{ 
                              background: risco.cor === '#ef4444' ? '#fee2e2' : '#fef3c7', 
                              color: risco.cor, 
                              padding: '6px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px' 
                            }}>
                              {risco.cor === '#ef4444' ? 'ALTO RISCO' : 'ATENÇÃO'}
                            </span>
                          </td>
                          <td style={{ padding: '15px', color: '#555', lineHeight: '1.4' }}>{risco.detalhe}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" style={{ padding: '50px', textAlign: 'center', background: '#f8fafc' }}>
                            <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 15px auto' }} />
                            <h3 style={{ margin: 0, color: '#10b981', fontSize: '20px' }}>Nenhum Risco de Malha Fina Detectado</h3>
                            <p style={{ color: '#64748b', marginTop: '10px' }}>A inteligência do sistema não encontrou notas puladas ou conflitos de CFOP/CST neste arquivo.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <BotoesAcao />
                </div>
              )}

              {/* ABA AUDITORIA (LOG COMPLETO COM AUTO-CURA DESTACADA) */}
              {abaAtiva === 'auditoria' && (
                <div className="card-dash" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #f0f4f8', paddingBottom: '20px', marginBottom: '30px' }}>
                    <h2 style={{ margin: 0, color: '#004080', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '15px' }}><Shield size={32} color="#10b981" /> Relatório Detalhado de Auditoria</h2>
                    <button className="no-print btn-pr" onClick={() => window.print()}><Printer size={18}/> Salvar PDF</button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#004080', color: '#fff', textAlign: 'left' }}>
                        <th style={{ padding: '15px' }}>Linha</th><th style={{ padding: '15px' }}>Registro do SPED</th><th style={{ padding: '15px' }}>Ação Realizada pelo Robô</th><th style={{ padding: '15px' }}>Detalhe Fiscal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logAuditoria.length > 0 ? logAuditoria.map((log, i) => {
                        const isCura = log.acao === 'CORRIGIDO PELO ROBÔ';
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #f0f4f8', background: isCura ? '#ecfdf5' : (i%2===0?'#fff':'#f8fafc') }}>
                            <td style={{ padding: '15px' }}>{log.linha}</td>
                            <td style={{ padding: '15px', fontWeight: 'bold' }}>{log.registro}</td>
                            <td style={{ padding: '15px' }}>
                              <span style={{ 
                                background: log.acao.includes('Removida') ? '#fee2e2' : isCura ? '#10b981' : '#fef3c7', 
                                color: log.acao.includes('Removida') ? '#ef4444' : isCura ? '#ffffff' : '#d97706', 
                                padding: '6px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px', boxShadow: isCura ? '0 4px 6px rgba(16,185,129,0.2)' : 'none'
                              }}>
                                {log.acao}
                              </span>
                            </td>
                            <td style={{ padding: '15px', color: isCura ? '#047857' : '#666', fontWeight: isCura ? '600' : 'normal' }}>{log.detalhe}</td>
                          </tr>
                        );
                      }) : (<tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#999', fontSize: '16px' }}>Nenhuma intervenção necessária neste arquivo. O SPED está limpo!</td></tr>)}
                    </tbody>
                  </table>
                  <BotoesAcao />
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}