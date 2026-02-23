import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Download, DollarSign, Calendar, Building2, TrendingUp, TrendingDown, ArrowRightLeft, Printer, RefreshCw, Calculator, Plus, Minus, Equal, Shield, Package, Truck, LayoutDashboard, Tags, Activity, MapPin, AlertTriangle, FileSearch, LineChart } from 'lucide-react';

export default function ImportadorSped() {
  const [mensagem, setMensagem] = useState('Arraste seu arquivo SPED ou clique para selecionar');
  const [status, setStatus] = useState('aguardando'); 
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

  // ESTADOS DO MÓDULO TRIBUTÁRIO AVANÇADO
  const [dadosTributacaoSaida, setDadosTributacaoSaida] = useState([]); 
  const [resumoTributacao, setResumoTributacao] = useState({ st: 0, servicos: 0, isento: 0, total: 0 });
  const [dadosEstados, setDadosEstados] = useState([]);
  const [logAuditoria, setLogAuditoria] = useState([]);
  const [dadosRoscaEntradas, setDadosRoscaEntradas] = useState([]);
  const [dadosEvolucaoDiaria, setDadosEvolucaoDiaria] = useState([]); // GRÁFICO DE ÁREA CLARO

  const CORES_ICMS = ['#004080', '#F59E0B']; 
  const CORES_OPERACOES = ['#10b981', '#4f46e5']; 
  const CORES_TRIBUTACAO = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
  const CORES_MAPA = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
  const CORES_ENTRADAS = ['#34d399', '#f87171', '#fbbf24', '#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#2dd4bf', '#94a3b8', '#818cf8', '#facc15'];

  const mapUfIbge = { '11': 'Rondônia', '12': 'Acre', '13': 'Amazonas', '14': 'Roraima', '15': 'Pará', '16': 'Amapá', '17': 'Tocantins', '21': 'Maranhão', '22': 'Piauí', '23': 'Ceará', '24': 'Rio Grande do Norte', '25': 'Paraíba', '26': 'Pernambuco', '27': 'Alagoas', '28': 'Sergipe', '29': 'Bahia', '31': 'Minas Gerais', '32': 'Espírito Santo', '33': 'Rio de Janeiro', '35': 'São Paulo', '41': 'Paraná', '42': 'Santa Catarina', '43': 'Rio Grande do Sul', '50': 'Mato Grosso do Sul', '51': 'Mato Grosso', '52': 'Goiás', '53': 'Distrito Federal', '99': 'Exterior' };

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const limparDados = () => {
    setStatus('aguardando'); setMensagem('Arraste seu arquivo SPED ou clique para selecionar');
    setAbaAtiva('home'); setArquivoProcessado(null); setNomeOriginal('');
    setDadosGraficoIcms([]); setAjustesICMS([]); setResumoIcms({ saldoCredor: 0, icmsRecolher: 0 });
    setGuiasE116([]); setDadosEmpresa({ nome: '', cnpj: '', periodo: '' }); setDadosGraficoOperacoes([]);
    setListaCfops({ entradas: [], saidas: [] }); setDadosVaf({ entradasBrutas: 0, saidasBrutas: 0, devVendas: 0, devCompras: 0, vafTotal: 0 });
    setRelatorioCorrecoes({ c191Removidos: 0, c173Removidos: 0, textosRemovidos: 0, blocosRecalculados: 0 });
    setTopProdutos({ vendas: [], compras: [] }); setTopFornecedores([]); setDadosTributacaoSaida([]);
    setResumoTributacao({ st: 0, servicos: 0, isento: 0, total: 0 }); setDadosEstados([]); setLogAuditoria([]); setDadosRoscaEntradas([]); setDadosEvolucaoDiaria([]);
  };

  const processarArquivo = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setStatus('processando'); setMensagem('Processando Evolução Diária e Auditoria Digital...');
    setNomeOriginal(file.name);

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
      let mProd = {}, mPart = {}, mPartEst = {}, vProd = {}, cProd = {}, cForn = {}, opAt = '', dataAtual = '01'; 
      let mTribSaida = {}, vST = 0, vServ = 0, vIse = 0, tAnalise = 0, cEstObj = {}; 
      let mapaDiario = {}; 
      let dEnt = { 'Revenda/Ind. - Tributadas': 0, 'Revenda/Ind. - Isentas': 0, 'Substituição Tributária (ST)': 0, 'Uso e Consumo': 0, 'Ativo Imobilizado': 0, 'Bonificações': 0, 'Combustíveis': 0, 'Desagregação de Carnes': 0, 'Simples Remessa': 0, 'Transporte': 0, 'Energia Elétrica': 0, 'Retorno Imob.': 0, 'Outras Entradas': 0 };

      linhasProcessadas.forEach(linha => {
        const colunas = linha.split('|');
        if (colunas[1] === '0000') setDadosEmpresa({ nome: colunas[6], cnpj: colunas[7], periodo: `${colunas[4]} a ${colunas[5]}` });
        if (colunas[1] === '0150') { mPart[colunas[2]] = colunas[3]; mPartEst[colunas[2]] = (colunas[4] && colunas[4] !== '01058') ? 'Exterior' : (colunas[8] ? (mapUfIbge[colunas[8].substring(0, 2)] || 'Outros') : 'N/A'); }
        if (colunas[1] === '0200') mProd[colunas[2]] = colunas[3]; 
        if (colunas[1] === 'C100') { 
            opAt = colunas[2]; 
            const dtDoc = colunas[10] || ''; 
            dataAtual = dtDoc.length >= 8 ? dtDoc.substring(0, 2) : '01'; 
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
          
          if (!mapaDiario[dataAtual]) mapaDiario[dataAtual] = { dia: dataAtual, Vendas: 0, Compras: 0, 'Dev. Vendas': 0, 'Dev. Compras': 0 };

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
          if (cfopsEntradasBrutas.has(cf)) { vafEnt += vlO; mapaDiario[dataAtual]['Compras'] += vlO; }
          if (cfopsSaidasBrutas.has(cf)) { vafSai += vlO; mapaDiario[dataAtual]['Vendas'] += vlO; }
          if (cfopsDevVendas.has(cf)) { vafDV += vlO; mapaDiario[dataAtual]['Dev. Vendas'] += vlO; }
          if (cfopsDevCompras.has(cf)) { vafDC += vlO; mapaDiario[dataAtual]['Dev. Compras'] += vlO; }
        }
        if (colunas[1] === 'E110') { totalDeb += parseFloat(colunas[2].replace(',', '.')) || 0; totalCred += parseFloat(colunas[6].replace(',', '.')) || 0; iRecFinal = parseFloat(colunas[13].replace(',', '.')) || 0; sCredFinal = parseFloat(colunas[14].replace(',', '.')) || 0; }
        if (colunas[1] === 'E111') listaAj.push({ codigo: colunas[2], descricao: colunas[2] === 'RO020003' ? 'ICMS Antecipado' : `Ajuste: ${colunas[2]}`, valor: parseFloat(colunas[4].replace(',', '.')) || 0 });
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
      
      const arrayDiario = Object.keys(mapaDiario).map(k => mapaDiario[k]).sort((a, b) => parseInt(a.dia) - parseInt(b.dia));
      setDadosEvolucaoDiaria(arrayDiario);

      setRelatorioCorrecoes({ c191Removidos: contC191, c173Removidos: contC173, textosRemovidos: contTextos, blocosRecalculados: (contC191 > 0 || contC173 > 0) ? 3 : 0 });
      setLogAuditoria(logTemp); setArquivoProcessado(linhasProcessadas.join('\r\n')); setStatus('sucesso');
    };
  };

  const BotoesAcao = () => (
    <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <button onClick={() => { const b = new Blob([arquivoProcessado], { type: 'text/plain;charset=windows-1252' }); const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = `AUDITTUS_${nomeOriginal}`; l.click(); }} style={{ padding: '15px 25px', backgroundColor: '#004080', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}><Download size={20} /> Baixar SPED Validado</button>
        <button onClick={() => window.print()} style={{ padding: '15px 25px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}><Printer size={20} /> Salvar Relatório (PDF)</button>
        <button onClick={limparDados} style={{ padding: '15px 25px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}><RefreshCw size={20} /> Nova Validação</button>
    </div>
  );

  return (
    <div className="main-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '30px', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div className="content-wrapper" style={{ width: '100%', maxWidth: '1600px' }}>
        <div className="no-print" style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#004080', margin: '0', fontSize: '32px', fontWeight: '800' }}>AUDITTUS</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '16px', fontWeight: '500' }}>Inteligência Fiscal e Auditoria Digital</p>
        </div>

        {status !== 'sucesso' && (
          <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '60px', backgroundColor: '#fff', borderRadius: '20px', border: '3px dashed #004080', textAlign: 'center', position: 'relative' }}>
            <input type="file" accept=".txt" onChange={processarArquivo} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            <UploadCloud size={64} color="#004080" style={{ marginBottom: '20px', opacity: 0.8 }} />
            <h2 style={{ margin: '0', color: '#004080', fontSize: '24px' }}>Arraste seu SPED Fiscal ou clique aqui</h2>
          </div>
        )}

        {status === 'sucesso' && (
          <div>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' }}>
              <button onClick={() => setAbaAtiva('home')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'home' ? '#004080' : '#fff', color: abaAtiva === 'home' ? '#fff' : '#004080', border: '2px solid #004080', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}><LayoutDashboard size={20} /> Principal</button>
              <button onClick={() => setAbaAtiva('tributos')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'tributos' ? '#10b981' : '#fff', color: abaAtiva === 'tributos' ? '#fff' : '#10b981', border: '2px solid #10b981', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}><Tags size={20} /> BI Tributário</button>
              <button onClick={() => setAbaAtiva('auditoria')} style={{ padding: '12px 25px', backgroundColor: abaAtiva === 'auditoria' ? '#ef4444' : '#fff', color: abaAtiva === 'auditoria' ? '#fff' : '#ef4444', border: '2px solid #ef4444', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}><FileSearch size={20} /> Auditoria</button>
            </div>

            <div className="print-banner" style={{ backgroundColor: '#004080', color: '#fff', padding: '20px 30px', borderRadius: '20px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><Building2 size={40} /><div><h2 style={{ margin: 0, fontSize: '22px' }}>{dadosEmpresa.nome}</h2><span style={{ fontSize: '14px', opacity: 0.8 }}>CNPJ: {dadosEmpresa.cnpj}</span></div></div>
              <div style={{ textAlign: 'right' }}><span style={{ fontSize: '12px', opacity: 0.8 }}>PERÍODO</span><strong style={{ display: 'block', fontSize: '18px' }}>{dadosEmpresa.periodo}</strong></div>
            </div>

            {/* ABA PRINCIPAL (HOME) */}
            {abaAtiva === 'home' && (
              <div style={{ display: 'flex', gap: '30px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '25px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px' }}>
                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                       <h3 style={{ color: '#004080', fontSize: '18px', marginBottom: '15px' }}><ArrowRightLeft size={20}/> Operações</h3>
                       <div style={{ height: '220px' }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dadosGraficoOperacoes} cx="50%" cy="50%" innerRadius={55} outerRadius={75} dataKey="value" animationDuration={1000}>{dadosGraficoOperacoes.map((e, i) => <Cell key={i} fill={CORES_OPERACOES[i % CORES_OPERACOES.length]} />)}</Pie><Tooltip formatter={(v) => formatarMoeda(v)} /><Legend /></PieChart></ResponsiveContainer></div>
                    </div>
                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                       <h3 style={{ color: '#004080', fontSize: '18px', marginBottom: '15px' }}>Resumo CFOP</h3>
                       <div style={{ maxHeight: '220px', overflowY: 'auto', fontSize: '12px' }}>
                          <div style={{ color: '#10b981', fontWeight: 'bold' }}>Entradas</div>{listaCfops.entradas.slice(0,3).map((it, idx) => <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>{it.cfop}</span><span>{formatarMoeda(it.valor)}</span></div>)}
                          <div style={{ color: '#4f46e5', fontWeight: 'bold', marginTop: '10px' }}>Saídas</div>{listaCfops.saidas.slice(0,3).map((it, idx) => <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>{it.cfop}</span><span>{formatarMoeda(it.valor)}</span></div>)}
                       </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #004080, #0284c7)', color: '#fff', padding: '25px', borderRadius: '20px', position: 'relative' }}>
                       <h3><Calculator size={22}/> VAF Fiscal</h3>
                       <div style={{ margin: '12px 0' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span>Saídas</span><strong>{formatarMoeda(dadosVaf.saidasBrutas)}</strong></div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span>Entradas</span><strong>-{formatarMoeda(dadosVaf.entradasBrutas)}</strong></div>
                       </div>
                       <div style={{ backgroundColor: '#fff', color: '#004080', padding: '12px', borderRadius: '15px', textAlign: 'center' }}>
                         <span style={{ fontSize: '11px', fontWeight: 'bold' }}>VALOR ADICIONADO</span><h2 style={{ margin: 0, fontSize: '24px' }}>{formatarMoeda(dadosVaf.vafTotal)}</h2>
                       </div>
                       {dadosVaf.vafTotal < 0 && <div style={{ position: 'absolute', bottom: '-35px', left: 0, width: '100%', textAlign: 'center' }}><span style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '5px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '800' }}><AlertTriangle size={14}/> ATENÇÃO! VAF Negativo</span></div>}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginTop: '10px' }}>
                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '20px' }}><h3 style={{ color: '#004080' }}><Package size={20}/> Top 10 Produtos</h3>{topProdutos.vendas.map((it, idx) => <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f4f8' }}><span style={{ fontSize: '12px' }}>{it.nome}</span><strong style={{ fontSize: '12px' }}>{formatarMoeda(it.valor)}</strong></div>)}</div>
                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '20px' }}><h3 style={{ color: '#004080' }}><Truck size={20}/> Top 5 Fornecedores</h3>{topFornecedores.map((it, idx) => <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f4f8' }}><span style={{ fontSize: '13px' }}>{it.nome}</span><strong>{formatarMoeda(it.valor)}</strong></div>)}</div>
                  </div>
                  <BotoesAcao />
                </div>
                <div style={{ width: '320px', backgroundColor: '#fff', borderRadius: '20px', padding: '25px' }} className="no-print">
                   <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Shield color="#10b981"/> Auditoria</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                     <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}><span>Linhas Removidas</span><h4 style={{ margin: 0 }}>{relatorioCorrecoes.c191Removidos + relatorioCorrecoes.c173Removidos}</h4></div>
                     <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}><span>Termos Limpos</span><h4 style={{ margin: 0 }}>{relatorioCorrecoes.textosRemovidos}</h4></div>
                     <div style={{ backgroundColor: '#004080', padding: '15px', borderRadius: '12px', color: '#fff', textAlign: 'center' }}><span>Total Intervenções</span><h2 style={{ margin: 0 }}>{relatorioCorrecoes.c191Removidos + relatorioCorrecoes.c173Removidos + relatorioCorrecoes.textosRemovidos}</h2></div>
                   </div>
                </div>
              </div>
            )}

            {/* ABA TRIBUTÁRIA (BI AVANÇADO) */}
            {abaAtiva === 'tributos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                
                {/* MEGA DASH: GRÁFICO DE ÁREA DIÁRIA COM TEMA CLARO E LIMPO */}
                <div style={{ backgroundColor: '#fff', padding: '35px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', color: '#333' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                        <h3 style={{ margin: 0, color: '#004080', fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}><LineChart size={28}/> Evolução Diária de Operações</h3>
                        
                        {/* Legenda Dinâmica Superior */}
                        <div style={{ display: 'flex', gap: '20px', fontSize: '14px', fontWeight: '700', color: '#555' }}>
                            {dadosVaf.saidasBrutas > 0 && <span style={{ display: 'flex', alignItems: 'center', gap:'5px' }}><div style={{width:'12px', height:'12px', borderRadius:'3px', background:'#10b981'}}></div> Vendas: {((dadosVaf.saidasBrutas / (dadosVaf.saidasBrutas + dadosVaf.entradasBrutas + dadosVaf.devVendas + dadosVaf.devCompras)) * 100).toFixed(1)}%</span>}
                            {dadosVaf.entradasBrutas > 0 && <span style={{ display: 'flex', alignItems: 'center', gap:'5px' }}><div style={{width:'12px', height:'12px', borderRadius:'3px', background:'#3b82f6'}}></div> Compras: {((dadosVaf.entradasBrutas / (dadosVaf.saidasBrutas + dadosVaf.entradasBrutas + dadosVaf.devVendas + dadosVaf.devCompras)) * 100).toFixed(1)}%</span>}
                            {dadosVaf.devVendas > 0 && <span style={{ display: 'flex', alignItems: 'center', gap:'5px' }}><div style={{width:'12px', height:'12px', borderRadius:'3px', background:'#ef4444'}}></div> Dev. Vendas: {((dadosVaf.devVendas / (dadosVaf.saidasBrutas + dadosVaf.entradasBrutas + dadosVaf.devVendas + dadosVaf.devCompras)) * 100).toFixed(1)}%</span>}
                            {dadosVaf.devCompras > 0 && <span style={{ display: 'flex', alignItems: 'center', gap:'5px' }}><div style={{width:'12px', height:'12px', borderRadius:'3px', background:'#f59e0b'}}></div> Dev. Compras: {((dadosVaf.devCompras / (dadosVaf.saidasBrutas + dadosVaf.entradasBrutas + dadosVaf.devVendas + dadosVaf.devCompras)) * 100).toFixed(1)}%</span>}
                        </div>
                    </div>

                    <div style={{ height: '350px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dadosEvolucaoDiaria} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVen" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorCom" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorDV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorDC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.8} />
                                <XAxis dataKey="dia" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `Dia ${v}`} />
                                <YAxis tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', color: '#333', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} formatter={(v) => formatarMoeda(v)} labelStyle={{ color: '#004080', fontWeight: 'bold', marginBottom: '5px' }} labelFormatter={(v) => `Movimento Dia ${v}`} />
                                <Area type="monotone" dataKey="Vendas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVen)" animationDuration={2000} />
                                <Area type="monotone" dataKey="Compras" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCom)" animationDuration={2000} />
                                <Area type="monotone" dataKey="Dev. Vendas" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDV)" animationDuration={2000} />
                                <Area type="monotone" dataKey="Dev. Compras" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorDC)" animationDuration={2000} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                  {/* LADO ESQUERDO: RESTAURADO - TRIBUTAÇÃO DE SAÍDAS (POR ALÍQUOTA) */}
                  <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ color: '#004080', marginBottom: '20px' }}><Activity size={22}/> Tributação das Saídas (C190)</h3>
                    <div style={{ height: '320px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={dadosTributacaoSaida} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" animationDuration={1200} label={({name, percent}) => `${name}: ${(percent*100).toFixed(1)}%`} labelLine={true} style={{ fontSize: '11px', fontWeight: 'bold' }}>
                            {dadosTributacaoSaida.map((e, i) => <Cell key={i} fill={CORES_TRIBUTACAO[i % CORES_TRIBUTACAO.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => formatarMoeda(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {dadosTributacaoSaida.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>{it.name}</span><strong style={{ color: '#004080' }}>{formatarMoeda(it.value)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* LADO DIREITO: AQUISIÇÕES POR ESTADO */}
                  <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ color: '#004080', marginBottom: '20px' }}><MapPin size={22}/> Aquisições por Estado</h3>
                    <div style={{ height: '320px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={dadosEstados} cx="50%" cy="50%" outerRadius={110} dataKey="value" animationDuration={1200} label={({name, percent}) => `${name}: ${(percent*100).toFixed(1)}%`} labelLine={true} style={{ fontSize: '11px', fontWeight: 'bold' }}>
                            {dadosEstados.map((e, i) => <Cell key={i} fill={CORES_MAPA[i % CORES_MAPA.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => formatarMoeda(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {dadosEstados.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #f0f4f8' }}>
                          <span style={{ fontSize: '13px', color: '#555', fontWeight: 'bold' }}>{it.name}</span><strong style={{ color: '#004080' }}>{formatarMoeda(it.value)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ROSCA DE ENTRADAS COM RELATÓRIO FIXO */}
                <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ color: '#004080', marginBottom: '20px' }}><Package size={22}/> Divisão de Entradas (Rosca BI)</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                        <div style={{ width: '40%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={dadosRoscaEntradas} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" animationDuration={1200} label={({percent}) => percent > 0.02 ? `${(percent*100).toFixed(1)}%` : ''} labelLine={false} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#fff' }}>
                                        {dadosRoscaEntradas.map((e, i) => <Cell key={i} fill={CORES_ENTRADAS[i % CORES_ENTRADAS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v) => formatarMoeda(v)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ width: '60%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {dadosRoscaEntradas.map((it, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', borderLeft: `5px solid ${CORES_ENTRADAS[idx % CORES_ENTRADAS.length]}` }}>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#555' }}>{it.name}</span>
                                    <div style={{ textAlign: 'right' }}>
                                        <strong style={{ fontSize: '13px', color: '#004080' }}>{formatarMoeda(it.value)}</strong>
                                        <span style={{ display: 'block', fontSize: '11px', color: '#999' }}>{((it.value / dadosVaf.entradasBrutas)*100).toFixed(2)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <BotoesAcao />
              </div>
            )}

            {/* ABA AUDITORIA (LOG) */}
            {abaAtiva === 'auditoria' && (
              <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #f0f4f8', paddingBottom: '20px', marginBottom: '30px' }}>
                   <h2><Shield color="#10b981"/> Relatório Detalhado de Auditoria</h2>
                   <button onClick={() => window.print()} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}><Printer size={18}/> Salvar PDF</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ backgroundColor: '#004080', color: '#fff', textAlign: 'left' }}><th style={{ padding: '15px' }}>Linha</th><th style={{ padding: '15px' }}>Registro</th><th style={{ padding: '15px' }}>Ação</th><th style={{ padding: '15px' }}>Detalhe</th></tr></thead>
                  <tbody>{logAuditoria.map((log, i) => <tr key={i} style={{ borderBottom: '1px solid #f0f4f8' }}><td style={{ padding: '12px' }}>{log.linha}</td><td style={{ padding: '12px', fontWeight: 'bold' }}>{log.registro}</td><td style={{ padding: '12px' }}><span style={{ backgroundColor: log.acao.includes('Removida') ? '#fee2e2' : '#fef3c7', color: log.acao.includes('Removida') ? '#ef4444' : '#d97706', padding: '4px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{log.acao}</span></td><td style={{ padding: '12px', color: '#666' }}>{log.detalhe}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}