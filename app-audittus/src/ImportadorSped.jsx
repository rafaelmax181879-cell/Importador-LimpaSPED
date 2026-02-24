import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Download, DollarSign, Calendar, Building2, TrendingUp, TrendingDown, ArrowRightLeft, Printer, RefreshCw, Calculator, Plus, Minus, Equal, Shield, Package, Truck, LayoutDashboard, Tags, Activity, MapPin, AlertTriangle, FileSearch, PieChart as PieChartIcon, Lock, Loader2 } from 'lucide-react';

// ==========================================
// CONFIGURAÇÕES DE ACESSO (CHAVES)
// ==========================================
const SENHA_ADMIN = "admin7474";
const SENHA_TESTE = "teste3478";
const TEMPO_TESTE_SEGUNDOS = 300; // 5 minutos

export default function ImportadorSped() {
  // ESTADOS DO SISTEMA
  const [faseAtual, setFaseAtual] = useState('login'); // 'login' | 'upload' | 'loading' | 'dashboard'
  const [senhaInput, setSenhaInput] = useState('');
  const [erroLogin, setErroLogin] = useState('');
  const [tipoAcesso, setTipoAcesso] = useState(null); // 'admin' | 'trial'
  const [tempoRestante, setTempoRestante] = useState(TEMPO_TESTE_SEGUNDOS);
  const [loadingText, setLoadingText] = useState('');

  const [abaAtiva, setAbaAtiva] = useState('home'); 
  const [arquivoProcessado, setArquivoProcessado] = useState(null);
  const [nomeOriginal, setNomeOriginal] = useState('');
  
  // ESTADOS DE DADOS (SPED)
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

  // CORES
  const CORES_ICMS = ['#004080', '#F59E0B']; 
  const CORES_OPERACOES = ['#10b981', '#4f46e5']; 
  const CORES_TRIBUTACAO = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
  const CORES_MAPA = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
  const CORES_ENTRADAS = ['#34d399', '#f87171', '#fbbf24', '#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#2dd4bf', '#94a3b8', '#818cf8', '#facc15'];

  const mapUfIbge = { '11': 'Rondônia', '12': 'Acre', '13': 'Amazonas', '14': 'Roraima', '15': 'Pará', '16': 'Amapá', '17': 'Tocantins', '21': 'Maranhão', '22': 'Piauí', '23': 'Ceará', '24': 'Rio Grande do Norte', '25': 'Paraíba', '26': 'Pernambuco', '27': 'Alagoas', '28': 'Sergipe', '29': 'Bahia', '31': 'Minas Gerais', '32': 'Espírito Santo', '33': 'Rio de Janeiro', '35': 'São Paulo', '41': 'Paraná', '42': 'Santa Catarina', '43': 'Rio Grande do Sul', '50': 'Mato Grosso do Sul', '51': 'Mato Grosso', '52': 'Goiás', '53': 'Distrito Federal', '99': 'Exterior' };

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  // EFEITO DO CRONÔMETRO DE TESTE
  useEffect(() => {
    let intervalo;
    if (faseAtual === 'dashboard' && tipoAcesso === 'trial' && tempoRestante > 0) {
      intervalo = setInterval(() => setTempoRestante(prev => prev - 1), 1000);
    }
    return () => clearInterval(intervalo);
  }, [faseAtual, tipoAcesso, tempoRestante]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (senhaInput === SENHA_ADMIN) {
      setTipoAcesso('admin');
      setFaseAtual('upload');
      setErroLogin('');
    } else if (senhaInput === SENHA_TESTE) {
      setTipoAcesso('trial');
      setTempoRestante(TEMPO_TESTE_SEGUNDOS);
      setFaseAtual('upload');
      setErroLogin('');
    } else {
      setErroLogin('Chave de acesso inválida.');
    }
  };

  const limparDados = () => {
    setFaseAtual('upload'); setArquivoProcessado(null); setNomeOriginal('');
    setAbaAtiva('home'); setDadosGraficoIcms([]); setAjustesICMS([]); setResumoIcms({ saldoCredor: 0, icmsRecolher: 0 });
    setGuiasE116([]); setDadosEmpresa({ nome: '', cnpj: '', periodo: '' }); setDadosGraficoOperacoes([]);
    setListaCfops({ entradas: [], saidas: [] }); setDadosVaf({ entradasBrutas: 0, saidasBrutas: 0, devVendas: 0, devCompras: 0, vafTotal: 0 });
    setRelatorioCorrecoes({ c191Removidos: 0, c173Removidos: 0, textosRemovidos: 0, blocosRecalculados: 0 });
    setTopProdutos({ vendas: [], compras: [] }); setTopFornecedores([]); setDadosTributacaoSaida([]);
    setResumoTributacao({ st: 0, servicos: 0, isento: 0, total: 0 }); setDadosEstados([]); setLogAuditoria([]); setDadosRoscaEntradas([]); setDadosComparativoMensal([]);
    if (tipoAcesso === 'trial') setTempoRestante(TEMPO_TESTE_SEGUNDOS);
  };

  const processarArquivo = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setNomeOriginal(file.name);

    // INICIA TELA DE LOADING PREMIUM
    setFaseAtual('loading');
    const mensagens = [
      "Lendo estrutura do arquivo SPED...",
      "Mapeando inteligência de CFOPs...",
      "Auditando cruzamentos de ICMS...",
      "Gerando painel de Business Intelligence..."
    ];
    let step = 0;
    setLoadingText(mensagens[0]);
    const inter = setInterval(() => {
      step++;
      if(step < mensagens.length) setLoadingText(mensagens[step]);
    }, 700);

    const reader = new FileReader();
    reader.readAsText(file, 'windows-1252');

    reader.onload = (e) => {
      const conteudoArquivo = e.target.result;
      const linhasOriginais = conteudoArquivo.split(/\r?\n/);
      let linhasProcessadas = [];
      let contC191 = 0, contC173 = 0, contTextos = 0, logTemp = [], numLinha = 0;
      const textosParaRemover = /\b(ISENTO|0000000|1111111|9999999|1500300|0300200|0300100|SEM GTIN|0500500|2003901|0300900|0301900|0112900|1800300)\b/gi;

      linhasOriginais.forEach((linha) => {
        numLinha++;
        const cols = linha.split('|');
        if (linha.startsWith('|C191|')) { contC191++; logTemp.push({ linha: numLinha, registro: 'C191', acao: 'Linha Removida', detalhe: 'Registro C191 excluído.' }); return; }
        if (linha.startsWith('|C173|')) { contC173++; logTemp.push({ linha: numLinha, registro: 'C173', acao: 'Linha Removida', detalhe: 'Registro C173 excluído.' }); return; }
        const matches = linha.match(textosParaRemover);
        if (matches) { contTextos += matches.length; logTemp.push({ linha: numLinha, registro: cols[1], acao: 'Termos Limpos', detalhe: `Removido: ${matches.join(', ')}` }); }
        if (linha.trim() !== '') linhasProcessadas.push(linha.replace(textosParaRemover, ''));
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
          const dtIni = colunas[4] || ''; const dtFin = colunas[5] || '';
          const pFormatado = (dtIni.length === 8 && dtFin.length === 8) ? `${dtIni.substring(0,2)}/${dtIni.substring(2,4)}/${dtIni.substring(4,8)} a ${dtFin.substring(0,2)}/${dtFin.substring(2,4)}/${dtFin.substring(4,8)}` : `${dtIni} a ${dtFin}`;
          let c = colunas[7] || '';
          const cnpjFormatado = c.length === 14 ? `${c.substring(0,2)}.${c.substring(2,5)}.${c.substring(5,8)}/${c.substring(8,12)}-${c.substring(12,14)}` : c;
          setDadosEmpresa({ nome: colunas[6] || 'Razão Social Não Identificada', cnpj: cnpjFormatado, periodo: pFormatado });
        }
        
        if (colunas[1] === '0150') { mPart[colunas[2]] = colunas[3]; mPartEst[colunas[2]] = (colunas[4] && colunas[4] !== '01058') ? 'Exterior' : (colunas[8] ? (mapUfIbge[colunas[8].substring(0, 2)] || 'Outros') : 'N/A'); }
        if (colunas[1] === '0200') mProd[colunas[2]] = colunas[3]; 
        
        if (colunas[1] === 'C100') { 
            opAt = colunas[2]; 
            const vlD = parseFloat(colunas[12]?.replace(',', '.')) || 0; 
            if (opAt === '0') { 
                tEnt += vlD; 
                if (colunas[4]) { cForn[colunas[4]] = (cForn[colunas[4]] || 0) + vlD; cEstObj[mPartEst[colunas[4]]] = (cEstObj[mPartEst[colunas[4]]] || 0) + vlD; } 
            } else if (opAt === '1') tSai += vlD; 
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
          if (cfopsEntradasBrutas.has(cf)) vafEnt += vlO; 
          if (cfopsSaidasBrutas.has(cf)) vafSai += vlO; 
          if (cfopsDevVendas.has(cf)) vafDV += vlO; 
          if (cfopsDevCompras.has(cf)) vafDC += vlO; 
        }
        
        if (colunas[1] === 'E110') { 
            totalDeb += parseFloat(colunas[2].replace(',', '.')) || 0; 
            totalCred += parseFloat(colunas[6].replace(',', '.')) || 0; 
            iRecFinal = parseFloat(colunas[13].replace(',', '.')) || 0; 
            sCredFinal = parseFloat(colunas[14].replace(',', '.')) || 0; 
        }
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
      setAjustesICMS(listaAj);
      setGuiasE116(listaG);

      setDadosComparativoMensal([
        { name: 'Vendas', value: vafSai, fill: '#10b981' },
        { name: 'Compras', value: vafEnt, fill: '#3b82f6' },
        { name: 'Dev. Vendas', value: vafDV, fill: '#ef4444' },
        { name: 'Dev. Compras', value: vafDC, fill: '#f59e0b' }
      ].filter(item => item.value > 0)); 

      setRelatorioCorrecoes({ c191Removidos: contC191, c173Removidos: contC173, textosRemovidos: contTextos, blocosRecalculados: (contC191 > 0 || contC173 > 0) ? 3 : 0 });
      setArquivoProcessado(linhasProcessadas.join('\r\n')); 
      
      // ILUSÃO DE TRABALHO: Aguarda 3 segundos para mostrar o dashboard
      setTimeout(() => {
        clearInterval(inter);
        setFaseAtual('dashboard');
      }, 3000);
    };
  };

  const BotoesAcao = () => (
    <div className="no-print" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '20px', marginTop: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <button onClick={() => { const b = new Blob([arquivoProcessado], { type: 'text/plain;charset=windows-1252' }); const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = `AUDITTUS_${nomeOriginal}`; l.click(); }} style={{ padding: '15px 25px', backgroundColor: '#004080', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}><Download size={20} /> Baixar SPED Validado</button>
        <button onClick={() => window.print()} style={{ padding: '15px 25px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}><Printer size={20} /> Salvar Relatório (PDF)</button>
        <button onClick={limparDados} style={{ padding: '15px 25px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}><RefreshCw size={20} /> Nova Validação</button>
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

  // RENDERIZAÇÃO DA TELA DE LOGIN
  if (faseAtual === 'login') {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f0f4f8', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0 }}>
        <div style={{ backgroundColor: '#fff', padding: '50px', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <Shield size={64} color="#004080" style={{ marginBottom: '20px' }} />
          <h1 style={{ margin: '0 0 5px 0', color: '#004080', fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>AUDITTUS</h1>
          <p style={{ margin: '0 0 30px 0', color: '#64748b', fontSize: '14px' }}>Inteligência Fiscal e Auditoria Digital</p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <input 
                type="password" 
                placeholder="Insira sua Chave de Acesso" 
                value={senhaInput} 
                onChange={(e) => setSenhaInput(e.target.value)} 
                style={{ width: '100%', boxSizing: 'border-box', padding: '15px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', outline: 'none', textAlign: 'center', transition: 'border 0.3s' }}
                onFocus={(e) => e.target.style.borderColor = '#004080'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
              {erroLogin && <span style={{ color: '#ef4444', fontSize: '12px', display: 'block', marginTop: '8px', fontWeight: 'bold' }}>{erroLogin}</span>}
            </div>
            <button type="submit" style={{ padding: '15px', backgroundColor: '#004080', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'background 0.3s' }} onMouseOver={(e) => e.target.style.backgroundColor = '#003366'} onMouseOut={(e) => e.target.style.backgroundColor = '#004080'}>
              <Lock size={18} /> Acessar Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  // RENDERIZAÇÃO DA TELA DE LOADING PREMIUM
  if (faseAtual === 'loading') {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f0f4f8', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <Loader2 size={64} color="#004080" className="spin-animation" style={{ animation: 'spin 2s linear infinite' }} />
          <h2 style={{ color: '#004080', margin: 0, fontSize: '24px' }}>Processando SPED...</h2>
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '600' }}>{loadingText}</p>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // RENDERIZAÇÃO PRINCIPAL DO DASHBOARD
  return (
    <div className="main-container">
      
      <style>
        {`
          body, html { margin: 0 !important; padding: 0 !important; width: 100% !important; min-height: 100vh !important; background-color: #f0f4f8 !important; }
          #root { width: 100% !important; min-height: 100vh !important; display: flex !important; flex-direction: column !important; max-width: none !important; padding: 0 !important; margin: 0 !important; }
          
          .main-container { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 100vh; background-color: #f0f4f8; padding: 30px; box-sizing: border-box; font-family: system-ui, sans-serif; width: 100%; flex-grow: 1; }
          .content-wrapper { width: 100%; max-width: 1600px; display: flex; flex-direction: column; flex-grow: 1; }

          .dashboard-layout { display: grid; grid-template-columns: 1fr 320px; gap: 30px; align-items: start; width: 100%; max-width: 100%; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1.2fr 1.2fr; gap: 25px; width: 100%; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; width: 100%; }
          .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; width: 100%; }
          
          .card-dash { background-color: #fff; padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); display: flex; flex-direction: column; min-width: 0; }
          .card-dash-small { background-color: #fff; padding: 25px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); textAlign: center; display: flex; flex-direction: column; justify-content: center; }
          .sidebar-auditoria { width: 100%; background-color: #fff; border-radius: 20px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); position: sticky; top: 30px; }
          
          .chart-flex { display: flex; align-items: center; justify-content: center; gap: 20px; width: 100%; }
          .chart-left { width: 45%; height: 320px; display: flex; align-items: center; justify-content: center; }
          .chart-right { width: 55%; display: flex; flex-direction: column; gap: 15px; max-height: 320px; overflow-y: auto; padding-right: 10px; }

          @media (max-width: 1400px) {
            .grid-3 { grid-template-columns: 1fr 1fr; }
            .grid-4 { grid-template-columns: 1fr 1fr; }
          }
          @media (max-width: 1024px) {
            .dashboard-layout { display: flex; flex-direction: column; }
            .sidebar-auditoria { position: static; width: 100%; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
            .sidebar-auditoria > div { margin: 0 !important; }
            
            .chart-flex { flex-direction: column; align-items: center; justify-content: center; gap: 30px; }
            .chart-left { width: 100%; display: flex; justify-content: center; align-items: center; height: 350px; }
            .chart-right { width: 100%; align-items: center; overflow: visible; max-height: none; }
            .grid-2-inner { grid-template-columns: 1fr 1fr; width: 100%; max-width: 600px; margin: 0 auto; }
          }
          @media (max-width: 768px) {
            .grid-3, .grid-2, .grid-4, .sidebar-auditoria { grid-template-columns: 1fr; }
            .grid-2-inner { grid-template-columns: 1fr; }
          }

          /* ================================================================================== */
          /* MODO DE IMPRESSÃO PREMIUM PDF (VERTICALIZADO, FONTE GIGANTE, SEM CORTES) */
          /* ================================================================================== */
          @media print {
            @page { size: A4 portrait; margin: 10mm; } 
            .no-print, button { display: none !important; }
            
            body, html { font-size: 14pt !important; background-color: #fff !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
            .main-container, .content-wrapper { display: flex !important; flex-direction: column !important; align-items: center !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
            ::-webkit-scrollbar { display: none; }

            h1 { font-size: 36pt !important; margin-bottom: 10px !important; }
            h2 { font-size: 28pt !important; margin-bottom: 15px !important; }
            h3 { font-size: 22pt !important; margin-bottom: 20px !important; border-bottom-width: 3px !important; }
            h4, p, span, strong, td, th { font-size: 14pt !important; }
            .card-dash h2, .card-dash-small h2, .print-vaf h2 { font-size: 34pt !important; font-weight: 900 !important; }

            .dashboard-layout, .grid-3, .grid-2, .grid-4, .sidebar-auditoria, .chart-flex, .grid-2-inner { 
                display: flex !important; flex-direction: column !important; width: 100% !important; gap: 30px !important; align-items: center !important; margin: 0 !important;
            }

            .card-dash, .card-dash-small, .print-vaf, .print-banner, .sidebar-auditoria > div { 
                width: 100% !important; max-width: 750px !important; height: auto !important; min-height: 0 !important; margin: 0 0 30px 0 !important; 
                page-break-inside: avoid !important; box-shadow: none !important; border: 2px solid #cbd5e1 !important; box-sizing: border-box !important; padding: 35px !important; 
            }
            .print-banner { border: 3px solid #004080 !important; background: #fff !important; color: #004080 !important; }
            
            .chart-left { width: 100% !important; height: auto !important; min-height: 400px !important; display: flex !important; justify-content: center !important; align-items: center !important; margin-bottom: 20px !important; }
            .chart-right { width: 100% !important; max-height: none !important; overflow: visible !important; display: flex !important; flex-direction: column !important; align-items: stretch !important; padding: 0 !important; }
            .chart-right h4 { text-align: left !important; width: 100% !important; border-bottom: 3px solid #f0f4f8 !important; padding-bottom: 15px !important; }
            
            .grid-2-inner { display: flex !important; flex-direction: column !important; width: 100% !important; gap: 15px !important; }
            .grid-2-inner > div { width: 100% !important; margin: 0 !important; padding: 25px !important; }

            .card-dash > div[style*="overflowY: auto"], .card-dash > div > div[style*="overflowY: auto"] { max-height: none !important; overflow: visible !important; height: auto !important; }
            .recharts-wrapper, .recharts-surface { overflow: visible !important; margin: 0 auto !important; }
          }
        `}
      </style>

      {/* OVERLAY DE BLOQUEIO DE TESTE */}
      {tipoAcesso === 'trial' && tempoRestante <= 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
          <AlertTriangle size={80} color="#ef4444" style={{ marginBottom: '20px' }} />
          <h1 style={{ color: '#004080', fontSize: '36px', fontWeight: '900', marginBottom: '10px' }}>Tempo de Demonstração Expirado</h1>
          <p style={{ color: '#64748b', fontSize: '20px', maxWidth: '600px', marginBottom: '30px' }}>Sua licença de teste de 5 minutos chegou ao fim. Adquira a licença completa para continuar utilizando a inteligência do AUDITTUS.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '15px 30px', backgroundColor: '#004080', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>Voltar ao Início</button>
        </div>
      )}

      {/* CRONÔMETRO FLUTUANTE (TRIAL) */}
      {tipoAcesso === 'trial' && tempoRestante > 0 && (
        <div className="no-print" style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: tempoRestante < 60 ? '#ef4444' : '#f59e0b', color: '#fff', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', zIndex: 9000, boxShadow: '0 4px 15px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} /> Modo Teste: {formatarTempo(tempoRestante)}
        </div>
      )}

      <div className="content-wrapper" style={{ filter: tempoRestante <= 0 && tipoAcesso === 'trial' ? 'blur(5px)' : 'none', transition: 'filter 0.5s' }}>
        
        <div className="no-print" style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#004080', margin: '0', fontSize: '32px', fontWeight: '800' }}>AUDITTUS</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '16px', fontWeight: '500' }}>Inteligência Fiscal e Auditoria Digital</p>
        </div>

        {faseAtual === 'upload' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '60px', backgroundColor: '#fff', borderRadius: '20px', border: '3px dashed #004080', textAlign: 'center', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <input type="file" accept=".txt" onChange={processarArquivo} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
              <UploadCloud size={64} color="#004080" style={{ marginBottom: '20px', opacity: 0.8 }} />
              <h2 style={{ margin: '0', color: '#004080', fontSize: '24px' }}>Arraste seu SPED Fiscal ou clique aqui</h2>
            </div>
          </div>
        )}

        {faseAtual === 'dashboard' && (
          <div>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
              <button onClick={() => setAbaAtiva('home')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'home' ? '#004080' : '#fff', color: abaAtiva === 'home' ? '#fff' : '#004080', border: '2px solid #004080', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}><LayoutDashboard size={20} /> Visão Geral</button>
              <button onClick={() => setAbaAtiva('tributos')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'tributos' ? '#10b981' : '#fff', color: abaAtiva === 'tributos' ? '#fff' : '#10b981', border: '2px solid #10b981', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}><Tags size={20} /> Módulo Tributário</button>
              <button onClick={() => setAbaAtiva('auditoria')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'auditoria' ? '#ef4444' : '#fff', color: abaAtiva === 'auditoria' ? '#fff' : '#ef4444', border: '2px solid #ef4444', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}><FileSearch size={20} /> Resultados da Auditoria</button>
            </div>

            <div className="print-banner" style={{ backgroundColor: '#004080', color: '#fff', padding: '20px 30px', borderRadius: '20px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0, 64, 128, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Building2 size={40} />
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px' }}>{dadosEmpresa.nome}</h2>
                  <span style={{ fontSize: '14px', opacity: 0.8 }}>CNPJ: {dadosEmpresa.cnpj}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '12px', opacity: 0.8 }}><Calendar size={14}/> PERÍODO</span>
                <strong style={{ display: 'block', fontSize: '18px' }}>{dadosEmpresa.periodo}</strong>
              </div>
            </div>

            {/* ABA PRINCIPAL (HOME) */}
            {abaAtiva === 'home' && (
              <div className="dashboard-layout">
                
                <div className="print-dashboard-area" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div className="grid-2" style={{ marginBottom: '25px' }}>
                    
                    {/* GRÁFICO DE OPERAÇÕES ENCORPADO E COM LEGENDA EXECUTIVA */}
                    <div className="card-dash print-card">
                      <h3 style={{ color: '#004080', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px', margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><ArrowRightLeft size={24}/> Volume de Operações</h3>
                      <div className="chart-flex">
                          <div className="chart-left">
                              <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                      <Pie 
                                          data={dadosGraficoOperacoes} 
                                          cx="50%" cy="50%" 
                                          innerRadius={65} 
                                          outerRadius={95} 
                                          paddingAngle={5} 
                                          dataKey="value" 
                                          animationDuration={1500}
                                          label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                                          labelLine={true}
                                          style={{ fontSize: '12px', fontWeight: 'bold' }}
                                      >
                                          {dadosGraficoOperacoes.map((e, i) => <Cell key={i} fill={CORES_OPERACOES[i % CORES_OPERACOES.length]} />)}
                                      </Pie>
                                      <Tooltip formatter={(v) => formatarMoeda(v)} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                                  </PieChart>
                              </ResponsiveContainer>
                          </div>
                          <div className="chart-right">
                              <div className="grid-2-inner">
                                {dadosGraficoOperacoes.map((it, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', borderLeft: `5px solid ${CORES_OPERACOES[idx % CORES_OPERACOES.length]}` }}>
                                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#555', lineHeight: '1.3' }}>{it.name}</span>
                                        <div style={{ textAlign: 'right', minWidth: '90px' }}>
                                            <strong style={{ fontSize: '14px', color: '#004080', display: 'block' }}>{formatarMoeda(it.value)}</strong>
                                        </div>
                                    </div>
                                ))}
                              </div>
                          </div>
                      </div>
                    </div>

                    <div className="card-dash print-card">
                      <h3 style={{ color: '#004080', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px', margin: '0 0 20px 0', fontSize: '20px' }}>Resumo por CFOP</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flexGrow: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <h4 style={{ color: '#10b981', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingDown size={18}/> Entradas</h4>
                          <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
                            {listaCfops.entradas.length > 0 ? listaCfops.entradas.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #f0f4f8', fontSize: '14px' }}><span style={{ fontWeight: 'bold', color: '#555' }}>{item.cfop}</span><span style={{ color: '#10b981', fontWeight: '600' }}>{formatarMoeda(item.valor)}</span></div>
                            )) : <p style={{ fontSize: '13px', color: '#999' }}>Sem entradas.</p>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #f0f4f8', paddingLeft: '20px' }}>
                          <h4 style={{ color: '#4f46e5', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={18}/> Saídas</h4>
                          <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
                            {listaCfops.saidas.length > 0 ? listaCfops.saidas.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #f0f4f8', fontSize: '14px' }}><span style={{ fontWeight: 'bold', color: '#555' }}>{item.cfop}</span><span style={{ color: '#4f46e5', fontWeight: '600' }}>{formatarMoeda(item.valor)}</span></div>
                            )) : <p style={{ fontSize: '13px', color: '#999' }}>Sem saídas.</p>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card-dash print-vaf" style={{ background: 'linear-gradient(135deg, #004080 0%, #0284c7 100%)', color: '#fff', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '15px', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}><Calculator size={26}/> VAF Fiscal do Período</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '10px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}><Plus size={16}/> Saídas Brutas</span><strong style={{ fontSize: '16px' }}>{formatarMoeda(dadosVaf.saidasBrutas)}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '10px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#fca5a5' }}><Minus size={16}/> Dev. Vendas</span><strong style={{ fontSize: '16px', color: '#fca5a5' }}>{formatarMoeda(dadosVaf.devVendas)}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '10px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}><Minus size={16}/> Entradas Brutas</span><strong style={{ fontSize: '16px' }}>{formatarMoeda(dadosVaf.entradasBrutas)}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '10px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#6ee7b7' }}><Plus size={16}/> Dev. Compras</span><strong style={{ fontSize: '16px', color: '#6ee7b7' }}>{formatarMoeda(dadosVaf.devCompras)}</strong></div>
                      </div>
                      <div style={{ backgroundColor: '#fff', color: '#004080', padding: '20px', borderRadius: '15px', textAlign: 'center', marginTop: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.15)' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}><Equal size={16}/> Valor Adicionado Gerado</p>
                        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-1px' }}>{formatarMoeda(dadosVaf.vafTotal)}</h2>
                      </div>
                      
                      {dadosVaf.vafTotal < 0 && (
                        <div style={{ position: 'absolute', bottom: '-40px', left: '0', right: '0', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#fee2e2', color: '#ef4444', padding: '6px 15px', borderRadius: '20px', fontWeight: '800', fontSize: '14px', boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)' }}><AlertTriangle size={18} /> ATENÇÃO! VAF Negativo</span>
                        </div>
                      )}
                    </div>

                    {/* GRÁFICO DE ICMS ENCORPADO COM LEGENDA EXECUTIVA */}
                    <div className="card-dash print-card">
                      <h3 style={{ color: '#004080', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px', margin: '0 0 20px 0', fontSize: '20px' }}>Apuração de ICMS</h3>
                      <div className="chart-flex">
                          <div className="chart-left">
                              <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                      <Pie 
                                          data={dadosGraficoIcms} 
                                          cx="50%" cy="50%" 
                                          innerRadius={65} 
                                          outerRadius={95} 
                                          paddingAngle={5} 
                                          dataKey="value" 
                                          animationDuration={1500}
                                          label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                                          labelLine={true}
                                          style={{ fontSize: '12px', fontWeight: 'bold' }}
                                      >
                                          {dadosGraficoIcms.map((e, i) => <Cell key={i} fill={CORES_ICMS[i % CORES_ICMS.length]} />)}
                                      </Pie>
                                      <Tooltip formatter={(v) => formatarMoeda(v)} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                                  </PieChart>
                              </ResponsiveContainer>
                          </div>
                          <div className="chart-right">
                              <div className="grid-2-inner">
                                {dadosGraficoIcms.map((it, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', borderLeft: `5px solid ${CORES_ICMS[idx % CORES_ICMS.length]}` }}>
                                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#555', lineHeight: '1.3' }}>{it.name}</span>
                                        <div style={{ textAlign: 'right', minWidth: '90px' }}>
                                            <strong style={{ fontSize: '14px', color: '#004080', display: 'block' }}>{formatarMoeda(it.value)}</strong>
                                        </div>
                                    </div>
                                ))}
                              </div>
                          </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', minWidth: 0 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%' }}>
                        <div className="card-dash print-card" style={{ padding: '20px', borderLeft: '6px solid #10b981' }}>
                          <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Saldo Credor Transportar</p>
                          <h2 style={{ margin: 0, color: '#10b981', fontSize: '24px', fontWeight: '800' }}>{formatarMoeda(resumoIcms.saldoCredor)}</h2>
                        </div>
                        <div className="card-dash print-card" style={{ padding: '20px', borderLeft: '6px solid #ef4444' }}>
                          <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>ICMS a Recolher</p>
                          <h2 style={{ margin: 0, color: '#ef4444', fontSize: '24px', fontWeight: '800' }}>{formatarMoeda(resumoIcms.icmsRecolher)}</h2>
                        </div>
                      </div>
                      
                      <div className="card-dash print-card" style={{ padding: '25px', width: '100%', flexGrow: 1 }}>
                        <h3 style={{ color: '#004080', borderBottom: '2px solid #f0f4f8', paddingBottom: '10px', margin: '0 0 15px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}><DollarSign size={20} /> Obrigações e Guias</h3>
                        <div style={{ maxHeight: '150px', overflowY: 'auto', paddingRight: '5px' }}>
                          {guiasE116.length > 0 ? guiasE116.map((guia, index) => (
                            <div key={index} style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Cód: {guia.codigo}</span>
                                <span style={{ fontSize: '12px', color: '#555' }}><Calendar size={12}/> Vencto: {guia.vencimento}</span>
                              </div>
                              <span style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '16px' }}>{formatarMoeda(guia.valor)}</span>
                            </div>
                          )) : <p style={{ fontSize: '13px', color: '#999', textAlign: 'center' }}>Sem guias apuradas.</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid-2 print-grid">
                    <div className="card-dash print-card">
                      <h3 style={{ color: '#004080', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px', margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Package size={24}/> {tituloTopProdutos}</h3>
                      <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '5px' }}>
                        {listaExibicaoProdutos.length > 0 ? listaExibicaoProdutos.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 10px', borderBottom: '1px solid #f0f4f8', backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                              <span style={{ backgroundColor: '#10b981', color: '#fff', minWidth: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', fontSize: '12px', fontWeight: 'bold' }}>{idx + 1}</span>
                              <span style={{ fontWeight: '600', color: '#444', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }} title={item.nome}>{item.nome}</span>
                            </div>
                            <span style={{ color: '#10b981', fontWeight: '700', fontSize: '15px', marginLeft: '10px' }}>{formatarMoeda(item.valor)}</span>
                          </div>
                        )) : <p style={{ fontSize: '13px', color: '#999', textAlign: 'center', marginTop: '20px' }}>Nenhum detalhamento de produto cadastrado no período.</p>}
                      </div>
                    </div>
                    <div className="card-dash print-card">
                      <h3 style={{ color: '#004080', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px', margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Truck size={24}/> Top 5 Maiores Fornecedores</h3>
                      <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '5px' }}>
                        {topFornecedores.length > 0 ? topFornecedores.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 10px', borderBottom: '1px solid #f0f4f8', backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                              <span style={{ backgroundColor: '#f59e0b', color: '#fff', minWidth: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', fontSize: '12px', fontWeight: 'bold' }}>{idx + 1}</span>
                              <span style={{ fontWeight: '600', color: '#444', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }} title={item.nome}>{item.nome}</span>
                            </div>
                            <span style={{ color: '#004080', fontWeight: '700', fontSize: '15px', marginLeft: '10px' }}>{formatarMoeda(item.valor)}</span>
                          </div>
                        )) : <p style={{ fontSize: '13px', color: '#999', textAlign: 'center', marginTop: '20px' }}>Nenhuma compra identificada no período.</p>}
                      </div>
                    </div>
                  </div>

                  <BotoesAcao />
                </div>

                <div className="sidebar-auditoria no-print">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '2px solid #f0f4f8', paddingBottom: '20px', marginBottom: '20px' }}>
                    <div style={{ backgroundColor: '#10b981', padding: '12px', borderRadius: '12px', display: 'flex', color: '#fff' }}><Shield size={28} /></div>
                    <div><h3 style={{ margin: 0, color: '#004080', fontSize: '18px', fontWeight: '800' }}>Auditoria Automática</h3><p style={{ margin: '2px 0 0 0', color: '#666', fontSize: '13px' }}>Ajustes e Correções</p></div>
                  </div>
                  
                  <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #3b82f6', marginBottom: '15px' }}>
                    <span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: '600' }}>Registros Removidos (C191/C173)</span>
                    <strong style={{ fontSize: '22px', color: '#3b82f6' }}>{relatorioCorrecoes.c191Removidos + relatorioCorrecoes.c173Removidos}</strong>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #f59e0b', marginBottom: '15px' }}>
                    <span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: '600' }}>Termos Proibidos Limpos</span>
                    <strong style={{ fontSize: '22px', color: '#f59e0b' }}>{relatorioCorrecoes.textosRemovidos}</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: '#999', marginTop: '4px' }}>Ex: ISENTO, Zeros, Sem GTIN</span>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                    <span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: '600' }}>Totalizadores Corrigidos</span>
                    <strong style={{ fontSize: '22px', color: '#10b981' }}>{relatorioCorrecoes.blocosRecalculados}</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: '#999', marginTop: '4px' }}>C990, 9990, 9999</span>
                  </div>
                  
                  <div style={{ marginTop: '25px', backgroundColor: '#004080', padding: '20px', borderRadius: '15px', textAlign: 'center', color: '#fff', boxShadow: '0 5px 15px rgba(0,64,128,0.2)' }}>
                    <span style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.8, marginBottom: '5px', fontWeight: '600' }}>Total de Intervenções</span>
                    <strong style={{ fontSize: '36px', fontWeight: '900' }}>{relatorioCorrecoes.c191Removidos + relatorioCorrecoes.c173Removidos + relatorioCorrecoes.textosRemovidos + relatorioCorrecoes.blocosRecalculados}</strong>
                  </div>
                </div>

              </div>
            )}

            {/* ABA TRIBUTÁRIA E RESULTADOS (BI AVANÇADO) */}
            {abaAtiva === 'tributos' && (
              <div className="dashboard-layout">
                
                <div className="print-dashboard-area" style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: '25px' }}>
                  
                  <div className="grid-4">
                    <div className="card-dash-small" style={{ borderTop: '6px solid #004080' }}>
                      <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Faturamento Analisado</p>
                      <h2 style={{ margin: 0, color: '#004080', fontSize: '26px', fontWeight: '900' }}>{formatarMoeda(resumoTributacao.total)}</h2>
                      <span style={{ display: 'block', fontSize: '12px', color: '#999', marginTop: '5px' }}>Baseado nas Saídas</span>
                    </div>
                    <div className="card-dash-small" style={{ borderTop: '6px solid #f59e0b' }}>
                      <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Substituição Tributária (ST)</p>
                      <h2 style={{ margin: 0, color: '#f59e0b', fontSize: '26px', fontWeight: '900' }}>{formatarMoeda(resumoTributacao.st)}</h2>
                      <span style={{ display: 'block', fontSize: '12px', color: '#999', marginTop: '5px' }}>CFOPs 54xx / 64xx / 74xx</span>
                    </div>
                    <div className="card-dash-small" style={{ borderTop: '6px solid #8b5cf6' }}>
                      <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Prestações de Serviços</p>
                      <h2 style={{ margin: 0, color: '#8b5cf6', fontSize: '26px', fontWeight: '900' }}>{formatarMoeda(resumoTributacao.servicos)}</h2>
                      <span style={{ display: 'block', fontSize: '12px', color: '#999', marginTop: '5px' }}>CFOPs 53xx / 63xx / 73xx</span>
                    </div>
                    <div className="card-dash-small" style={{ borderTop: '6px solid #ef4444' }}>
                      <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Isentas / Não Tributadas</p>
                      <h2 style={{ margin: 0, color: '#ef4444', fontSize: '26px', fontWeight: '900' }}>{formatarMoeda(resumoTributacao.isento)}</h2>
                      <span style={{ display: 'block', fontSize: '12px', color: '#999', marginTop: '5px' }}>Sem destaque de ICMS</span>
                    </div>
                  </div>

                  <div className="card-dash print-card">
                      <h3 style={{ margin: '0 0 25px 0', color: '#004080', fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <PieChartIcon size={28}/> Fluxo Mensal: Compras vs. Vendas
                      </h3>

                      <div className="chart-flex">
                          <div className="chart-left">
                              <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                      <Pie 
                                          data={dadosComparativoMensal} 
                                          cx="50%" cy="50%" 
                                          innerRadius={55} 
                                          outerRadius={85} 
                                          paddingAngle={6} 
                                          cornerRadius={12} 
                                          dataKey="value" 
                                          animationDuration={1500}
                                          label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(1)}%` : null}
                                          labelLine={true}
                                          style={{ fontSize: '12px', fontWeight: 'bold' }}
                                      >
                                          {dadosComparativoMensal.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                                      </Pie>
                                      <Tooltip formatter={(v) => formatarMoeda(v)} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                                  </PieChart>
                              </ResponsiveContainer>
                          </div>
                          <div className="chart-right">
                              <h4 style={{ fontSize: '16px', color: '#666', borderBottom: '2px solid #f0f4f8', paddingBottom: '10px', margin: '0 0 15px 0' }}>Detalhamento Financeiro</h4>
                              <div className="grid-2-inner">
                                  {dadosComparativoMensal.map((it, idx) => (
                                      <div key={idx} style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '15px', borderLeft: `6px solid ${it.fill}`, display: 'flex', flexDirection: 'column' }}>
                                          <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>{it.name}</span>
                                          <strong style={{ fontSize: '20px', color: '#1e293b' }}>{formatarMoeda(it.value)}</strong>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="grid-2 print-grid">
                    <div className="card-dash print-card">
                      <h3 style={{ margin: '0 0 25px 0', color: '#004080', fontSize: '22px', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={24} /> Tributação das Saídas (C190)
                      </h3>
                      <div className="chart-flex">
                        <div className="chart-left">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie 
                                data={dadosTributacaoSaida} 
                                cx="50%" cy="50%" 
                                innerRadius={55} 
                                outerRadius={85} 
                                paddingAngle={4} 
                                dataKey="value" 
                                animationDuration={1200}
                                label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(1)}%` : null}
                                labelLine={true}
                                style={{ fontSize: '11px', fontWeight: 'bold' }}
                              >
                                {dadosTributacaoSaida.map((e, i) => <Cell key={i} fill={CORES_TRIBUTACAO[i % CORES_TRIBUTACAO.length]} />)}
                              </Pie>
                              <Tooltip formatter={(v) => formatarMoeda(v)} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="chart-right">
                          {dadosTributacaoSaida.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', borderLeft: `5px solid ${CORES_TRIBUTACAO[idx % CORES_TRIBUTACAO.length]}` }}>
                              <span style={{ fontSize: '13px', color: '#555', fontWeight: '600', lineHeight: '1.2' }}>{it.name}</span>
                              <strong style={{ fontSize: '14px', color: '#004080', marginLeft: '10px' }}>{formatarMoeda(it.value)}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="card-dash print-card">
                      <h3 style={{ margin: '0 0 25px 0', color: '#004080', fontSize: '22px', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MapPin size={24} /> Aquisições por Estado
                      </h3>
                      <div className="chart-flex">
                        <div className="chart-left">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie 
                                 data={dadosEstados} 
                                 cx="50%" cy="50%" 
                                 innerRadius={55} 
                                 outerRadius={85} 
                                 paddingAngle={4} 
                                 dataKey="value" 
                                 animationDuration={1200}
                                 label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(1)}%` : null}
                                 labelLine={true}
                                 style={{ fontSize: '11px', fontWeight: 'bold' }}
                              >
                                {dadosEstados.map((e, i) => <Cell key={i} fill={CORES_MAPA[i % CORES_MAPA.length]} />)}
                              </Pie>
                              <Tooltip formatter={(v) => formatarMoeda(v)} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="chart-right">
                          {dadosEstados.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', borderLeft: `5px solid ${CORES_MAPA[idx % CORES_MAPA.length]}` }}>
                              <span style={{ fontSize: '13px', color: '#555', fontWeight: '600' }}>{it.name}</span>
                              <strong style={{ fontSize: '14px', color: '#004080', marginLeft: '10px' }}>{formatarMoeda(it.value)}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card-dash print-card">
                      <h3 style={{ margin: '0 0 25px 0', color: '#004080', fontSize: '22px', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Package size={24}/> Divisão de Entradas (Rosca BI)
                      </h3>
                      <div className="chart-flex">
                          <div className="chart-left">
                              <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                      <Pie 
                                          data={dadosRoscaEntradas} 
                                          cx="50%" cy="50%" 
                                          innerRadius={55} 
                                          outerRadius={85} 
                                          paddingAngle={4} 
                                          dataKey="value" 
                                          animationDuration={1200}
                                          label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(1)}%` : null}
                                          labelLine={true}
                                          style={{ fontSize: '11px', fontWeight: 'bold' }}
                                      >
                                          {dadosRoscaEntradas.map((e, i) => <Cell key={i} fill={CORES_ENTRADAS[i % CORES_ENTRADAS.length]} />)}
                                      </Pie>
                                      <Tooltip formatter={(v) => formatarMoeda(v)} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                                  </PieChart>
                              </ResponsiveContainer>
                          </div>
                          <div className="chart-right">
                              <div className="grid-2-inner">
                                {dadosRoscaEntradas.map((it, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', borderLeft: `5px solid ${CORES_ENTRADAS[idx % CORES_ENTRADAS.length]}` }}>
                                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#555', lineHeight: '1.3' }}>{it.name}</span>
                                        <div style={{ textAlign: 'right', minWidth: '90px' }}>
                                            <strong style={{ fontSize: '14px', color: '#004080', display: 'block' }}>{formatarMoeda(it.value)}</strong>
                                        </div>
                                    </div>
                                ))}
                              </div>
                          </div>
                      </div>
                  </div>

                  <BotoesAcao />
                </div>

                <div className="sidebar-auditoria no-print">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '2px solid #f0f4f8', paddingBottom: '20px', marginBottom: '20px' }}>
                    <div style={{ backgroundColor: '#10b981', padding: '12px', borderRadius: '12px', display: 'flex', color: '#fff' }}><Shield size={28} /></div>
                    <div><h3 style={{ margin: 0, color: '#004080', fontSize: '18px', fontWeight: '800' }}>Auditoria Automática</h3><p style={{ margin: '2px 0 0 0', color: '#666', fontSize: '13px' }}>Ajustes e Correções</p></div>
                  </div>
                  
                  <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #3b82f6', marginBottom: '15px' }}>
                    <span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: '600' }}>Registros Removidos (C191/C173)</span>
                    <strong style={{ fontSize: '22px', color: '#3b82f6' }}>{relatorioCorrecoes.c191Removidos + relatorioCorrecoes.c173Removidos}</strong>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #f59e0b', marginBottom: '15px' }}>
                    <span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: '600' }}>Termos Proibidos Limpos</span>
                    <strong style={{ fontSize: '22px', color: '#f59e0b' }}>{relatorioCorrecoes.textosRemovidos}</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: '#999', marginTop: '4px' }}>Ex: ISENTO, Zeros, Sem GTIN</span>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                    <span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: '600' }}>Totalizadores Corrigidos</span>
                    <strong style={{ fontSize: '22px', color: '#10b981' }}>{relatorioCorrecoes.blocosRecalculados}</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: '#999', marginTop: '4px' }}>C990, 9990, 9999</span>
                  </div>
                  
                  <div style={{ marginTop: '25px', backgroundColor: '#004080', padding: '20px', borderRadius: '15px', textAlign: 'center', color: '#fff', boxShadow: '0 5px 15px rgba(0,64,128,0.2)' }}>
                    <span style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.8, marginBottom: '5px', fontWeight: '600' }}>Total de Intervenções</span>
                    <strong style={{ fontSize: '36px', fontWeight: '900' }}>{relatorioCorrecoes.c191Removidos + relatorioCorrecoes.c173Removidos + relatorioCorrecoes.textosRemovidos + relatorioCorrecoes.blocosRecalculados}</strong>
                  </div>
                </div>

              </div>
            )}

            {/* ABA AUDITORIA (LOG) */}
            {abaAtiva === 'auditoria' && (
              <div className="card-dash print-card" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #f0f4f8', paddingBottom: '20px', marginBottom: '30px' }}>
                   <h2 style={{ margin: 0, color: '#004080', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '15px' }}><Shield size={32} color="#10b981" /> Relatório Detalhado de Auditoria</h2>
                   <button onClick={() => window.print()} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Printer size={18}/> Salvar PDF</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#004080', color: '#fff', textAlign: 'left' }}>
                      <th style={{ padding: '15px' }}>Linha</th>
                      <th style={{ padding: '15px' }}>Registro</th>
                      <th style={{ padding: '15px' }}>Ação Realizada</th>
                      <th style={{ padding: '15px' }}>Detalhe do Ajuste</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logAuditoria.map((log, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f0f4f8', backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td style={{ padding: '12px' }}>{log.linha}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{log.registro}</td>
                        <td style={{ padding: '12px' }}><span style={{ backgroundColor: log.acao.includes('Removida') ? '#fee2e2' : '#fef3c7', color: log.acao.includes('Removida') ? '#ef4444' : '#d97706', padding: '4px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{log.acao}</span></td>
                        <td style={{ padding: '12px', color: '#666' }}>{log.detalhe}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}