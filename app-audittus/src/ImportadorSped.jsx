import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Download, DollarSign, Calendar, Building2, TrendingUp, TrendingDown, ArrowRightLeft, Printer, RefreshCw, Calculator, Plus, Minus, Equal, Shield, Package, Truck } from 'lucide-react';

export default function ImportadorSped() {
  const [mensagem, setMensagem] = useState('Arraste seu arquivo SPED ou clique para selecionar');
  const [status, setStatus] = useState('aguardando'); 
  const [dadosGraficoIcms, setDadosGraficoIcms] = useState([]);
  const [ajustesICMS, setAjustesICMS] = useState([]);
  const [resumoIcms, setResumoIcms] = useState({ saldoCredor: 0, icmsRecolher: 0 });
  const [guiasE116, setGuiasE116] = useState([]);
  const [dadosEmpresa, setDadosEmpresa] = useState({ nome: '', cnpj: '', periodo: '' });
  const [dadosGraficoOperacoes, setDadosGraficoOperacoes] = useState([]);
  const [listaCfops, setListaCfops] = useState({ entradas: [], saidas: [] });
  const [arquivoProcessado, setArquivoProcessado] = useState(null);
  const [nomeOriginal, setNomeOriginal] = useState('');
  const [dadosVaf, setDadosVaf] = useState({ entradasBrutas: 0, saidasBrutas: 0, devVendas: 0, devCompras: 0, vafTotal: 0 });
  const [relatorioCorrecoes, setRelatorioCorrecoes] = useState({ c191Removidos: 0, c173Removidos: 0, textosRemovidos: 0, blocosRecalculados: 0 });
  
  // NOVOS ESTADOS: RANKINGS
  const [topProdutos, setTopProdutos] = useState([]);
  const [topFornecedores, setTopFornecedores] = useState([]);

  const CORES_ICMS = ['#004080', '#F59E0B']; 
  const CORES_OPERACOES = ['#10b981', '#4f46e5']; 

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const limparDados = () => {
    setStatus('aguardando'); setMensagem('Arraste seu arquivo SPED ou clique para selecionar');
    setDadosGraficoIcms([]); setAjustesICMS([]); setResumoIcms({ saldoCredor: 0, icmsRecolher: 0 });
    setGuiasE116([]); setDadosEmpresa({ nome: '', cnpj: '', periodo: '' });
    setDadosGraficoOperacoes([]); setListaCfops({ entradas: [], saidas: [] });
    setDadosVaf({ entradasBrutas: 0, saidasBrutas: 0, devVendas: 0, devCompras: 0, vafTotal: 0 });
    setRelatorioCorrecoes({ c191Removidos: 0, c173Removidos: 0, textosRemovidos: 0, blocosRecalculados: 0 });
    setTopProdutos([]); setTopFornecedores([]);
    setArquivoProcessado(null); setNomeOriginal('');
  };

  const gerarPDF = () => window.print();

  const processarArquivo = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setStatus('processando'); setMensagem('Processando Business Intelligence e VAF Fiscal...');
    setNomeOriginal(file.name); setDadosEmpresa({ nome: '', cnpj: '', periodo: '' });

    const reader = new FileReader();
    reader.readAsText(file, 'windows-1252');

    reader.onload = (e) => {
      const conteudoArquivo = e.target.result;
      let linhasSped = conteudoArquivo.split(/\r?\n/);

      let contC191 = 0; let contC173 = 0; let contTextos = 0;

      linhasSped = linhasSped.filter(linha => {
        const t = linha.trim(); 
        if (t.startsWith('|C191|')) { contC191++; return false; }
        if (t.startsWith('|C173|')) { contC173++; return false; }
        return t !== '';
      });

      const textosParaRemover = /\b(ISENTO|0000000|1111111|9999999|1500300|0300200|0300100|SEM GTIN|0500500|2003901|0300900|0301900|0112900|1800300)\b/gi;
      linhasSped = linhasSped.map(linha => {
        const matches = linha.match(textosParaRemover);
        if (matches) contTextos += matches.length;
        return linha.replace(textosParaRemover, '');
      });

      // CFOPs CORRIGIDOS (Inclusão Fretes e 5117/6117)
      const cfopsEntradasBrutas = new Set([
        '1102','2102','3102','1117','2117','1403','2403','1101','2101','3101','1122','2122','1401','2401',
        '1351','1352','1353','1354','1355','1356','2351','2352','2353','2354','2355','2356','3351','3352','3353','3354','3355','3356'
      ]);
      const cfopsSaidasBrutas = new Set([
        '5102','6102','7102','5115','6115','5403','6403','5405','5101','6101','7101','5113','6113','5401','6401','5117','6117',
        '5351','6351','7351','5352','6352','7352','5353','6353','7353','5354','6354','7354','5355','6355','7355','5356','6356','7356','5357','6357','7357',
        '5301','6301','7301','5302','6302','7302','5303','6303','7303','5304','6304','7304','5305','6305','7305','5306','6306','7306','5307','6307','7307'
      ]);
      const cfopsDevVendas = new Set(['1202','2202','3202','1411','2411','1201','2201','3201','1410','2410','1206','2206','1207','2207']);
      const cfopsDevCompras = new Set(['5202','6202','7202','5411','6411','5201','6201','7201','5410','6410','5206','6206','5207','6207']);

      let totalDebitos = 0; let totalCreditos = 0;
      let totalEntradas = 0; let totalSaidas = 0;
      let vafEntradas = 0; let vafSaidas = 0; let vafDevVen = 0; let vafDevCom = 0;
      let mapaCfopEntrada = {}; let mapaCfopSaida = {};
      let listaAjustes = []; let listaGuias = [];
      let saldoCredorFinal = 0; let icmsRecolherFinal = 0;

      // Variáveis BI
      let mapaProdutos = {}; 
      let mapaParticipantes = {}; 
      let vendasPorProduto = {}; 
      let comprasPorFornecedor = {};
      let operacaoAtual = ''; // Guarda se a NF atual é Entrada (0) ou Saída (1)

      linhasSped.forEach(linha => {
        const colunas = linha.split('|');
        
        if (colunas[1] === '0000') {
          const dtIni = colunas[4] || ''; const dtFin = colunas[5] || '';
          const pFormatado = (dtIni.length === 8 && dtFin.length === 8) ? `${dtIni.substring(0,2)}/${dtIni.substring(2,4)}/${dtIni.substring(4,8)} a ${dtFin.substring(0,2)}/${dtFin.substring(2,4)}/${dtFin.substring(4,8)}` : `${dtIni} a ${dtFin}`;
          let c = colunas[7] || '';
          const cnpjFormatado = c.length === 14 ? `${c.substring(0,2)}.${c.substring(2,5)}.${c.substring(5,8)}/${c.substring(8,12)}-${c.substring(12,14)}` : c;
          setDadosEmpresa({ nome: colunas[6] || 'Razão Social Não Identificada', cnpj: cnpjFormatado, periodo: pFormatado });
        }

        // CADASTROS PARA O BI
        if (colunas[1] === '0150') mapaParticipantes[colunas[2]] = colunas[3]; // Participantes (Fornecedores/Clientes)
        if (colunas[1] === '0200') mapaProdutos[colunas[2]] = colunas[3]; // Produtos

        if (colunas[1] === 'C100') {
          operacaoAtual = colunas[2]; // 0-Entrada, 1-Saída
          const codPart = colunas[4];
          const vlDoc = parseFloat(colunas[12]?.replace(',', '.')) || 0;
          
          if (operacaoAtual === '0') {
            totalEntradas += vlDoc;
            if (codPart) comprasPorFornecedor[codPart] = (comprasPorFornecedor[codPart] || 0) + vlDoc;
          } else if (operacaoAtual === '1') {
            totalSaidas += vlDoc;
          }
        }

        // ITENS VENDIDOS (BI)
        if (colunas[1] === 'C170') {
          if (operacaoAtual === '1') { // Se a NF "Pai" é de Saída
            const codItem = colunas[3];
            const vlItem = parseFloat(colunas[7]?.replace(',', '.')) || 0;
            vendasPorProduto[codItem] = (vendasPorProduto[codItem] || 0) + vlItem;
          }
        }

        if (colunas[1] === 'C190' || colunas[1] === 'D190') {
          const cfop = colunas[3];
          const vlOpr = parseFloat(colunas[5]?.replace(',', '.')) || 0;
          
          if (cfop.startsWith('1') || cfop.startsWith('2') || cfop.startsWith('3')) {
            mapaCfopEntrada[cfop] = (mapaCfopEntrada[cfop] || 0) + vlOpr;
          } else if (cfop.startsWith('5') || cfop.startsWith('6') || cfop.startsWith('7')) {
            mapaCfopSaida[cfop] = (mapaCfopSaida[cfop] || 0) + vlOpr;
          }

          if (cfopsEntradasBrutas.has(cfop)) vafEntradas += vlOpr;
          if (cfopsSaidasBrutas.has(cfop)) vafSaidas += vlOpr;
          if (cfopsDevVendas.has(cfop)) vafDevVen += vlOpr;
          if (cfopsDevCompras.has(cfop)) vafDevCom += vlOpr;
        }

        if (colunas[1] === 'E110') {
          totalDebitos += parseFloat(colunas[2].replace(',', '.')) || 0;
          totalCreditos += parseFloat(colunas[6].replace(',', '.')) || 0;
          icmsRecolherFinal = parseFloat(colunas[13].replace(',', '.')) || 0;
          saldoCredorFinal = parseFloat(colunas[14].replace(',', '.')) || 0;
        }
        
        if (colunas[1] === 'E111') {
          const codAjuste = colunas[2];
          const valorAjuste = parseFloat(colunas[4].replace(',', '.')) || 0;
          let descricao = codAjuste === 'RO020003' ? 'ICMS Antecipado' : codAjuste === 'RO050010' ? 'FECOEP a Recolher' : `Ajuste: ${codAjuste}`;
          listaAjustes.push({ codigo: codAjuste, descricao, valor: valorAjuste });
        }
        
        if (colunas[1] === 'E116') {
          const v = colunas[4]; 
          const vencimentoFormatado = v && v.length === 8 ? `${v.substring(0,2)}/${v.substring(2,4)}/${v.substring(4,8)}` : v;
          const codReceita = colunas[5] && colunas[5].trim() !== '' ? colunas[5] : colunas[2]; 
          listaGuias.push({ codigo: codReceita, valor: parseFloat(colunas[3].replace(',', '.')) || 0, vencimento: vencimentoFormatado });
        }
      });

      const arrEntradas = Object.keys(mapaCfopEntrada).map(k => ({ cfop: k, valor: mapaCfopEntrada[k] })).sort((a,b) => b.valor - a.valor);
      const arrSaidas = Object.keys(mapaCfopSaida).map(k => ({ cfop: k, valor: mapaCfopSaida[k] })).sort((a,b) => b.valor - a.valor);

      // Arrays BI Ordenados
      const topProd = Object.keys(vendasPorProduto)
        .map(k => ({ nome: mapaProdutos[k] || `Produto sem cadastro (${k})`, valor: vendasPorProduto[k] }))
        .sort((a, b) => b.valor - a.valor).slice(0, 10);
      
      const topForn = Object.keys(comprasPorFornecedor)
        .map(k => ({ nome: mapaParticipantes[k] || `Fornecedor sem cadastro (${k})`, valor: comprasPorFornecedor[k] }))
        .sort((a, b) => b.valor - a.valor).slice(0, 5);

      setDadosGraficoIcms([{ name: 'Créditos', value: totalCreditos }, { name: 'Débitos', value: totalDebitos }]);
      setDadosGraficoOperacoes([{ name: 'Total Entradas', value: totalEntradas }, { name: 'Total Saídas', value: totalSaidas }]);
      setListaCfops({ entradas: arrEntradas, saidas: arrSaidas });
      setTopProdutos(topProd);
      setTopFornecedores(topForn);
      
      const calculoVaf = (vafSaidas - vafDevVen) - (vafEntradas - vafDevCom);
      setDadosVaf({ entradasBrutas: vafEntradas, saidasBrutas: vafSaidas, devVendas: vafDevVen, devCompras: vafDevCom, vafTotal: calculoVaf });

      setAjustesICMS(listaAjustes);
      setResumoIcms({ saldoCredor: saldoCredorFinal, icmsRecolher: icmsRecolherFinal });
      setGuiasE116(listaGuias);

      const totalC = linhasSped.filter(l => l.startsWith('|C')).length;
      const total9 = linhasSped.filter(l => l.startsWith('|9')).length;
      const totalGeral = linhasSped.length;
      const resultadoFinal = linhasSped.map(linha => {
        if (linha.startsWith('|C990|')) return `|C990|${totalC}|`;
        if (linha.startsWith('|9990|')) return `|9990|${total9}|`;
        if (linha.startsWith('|9999|')) return `|9999|${totalGeral}|`;
        return linha;
      }).join('\r\n');

      setRelatorioCorrecoes({ c191Removidos: contC191, c173Removidos: contC173, textosRemovidos: contTextos, blocosRecalculados: 3 });
      setArquivoProcessado(resultadoFinal);
      setStatus('sucesso');
      setMensagem('Dashboard de BI e VAF calculados com sucesso!');
    };
  };

  const baixarArquivo = () => {
    if (!arquivoProcessado) return;
    const blob = new Blob([arquivoProcessado], { type: 'text/plain;charset=windows-1252' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = `AUDITTUS_${nomeOriginal}`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="main-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: status !== 'sucesso' ? 'center' : 'flex-start', minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '30px', boxSizing: 'border-box', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: '#333' }}>
      
      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 15mm; }
            .no-print, button { display: none !important; }
            body, html { background-color: #fff !important; margin: 0 !important; padding: 0 !important; }
            .main-container { background-color: #fff !important; display: block !important; padding: 0 !important; }
            .content-wrapper { width: 100% !important; max-width: 100% !important; margin: 0 auto !important; display: block !important; }
            .print-dashboard-area { width: 100% !important; max-width: 100% !important; display: block !important; }
            ::-webkit-scrollbar { display: none; }
            .print-grid { display: flex !important; flex-direction: column !important; align-items: center !important; gap: 25px !important; margin-bottom: 25px !important; }
            .print-flex-col { display: flex !important; flex-direction: column !important; align-items: center !important; width: 100% !important; gap: 25px !important; }
            .print-card, .print-vaf, .print-banner { width: 100% !important; max-width: 650px !important; margin: 0 auto !important; page-break-inside: avoid !important; break-inside: avoid !important; box-shadow: none !important; border: 1px solid #cbd5e1 !important; box-sizing: border-box !important; }
            .print-banner { border: 2px solid #004080 !important; background: #fff !important; color: #004080 !important; }
            .print-banner h2, .print-banner span, .print-banner strong, .print-banner p { color: #004080 !important; }
            .print-banner svg { stroke: #004080 !important; }
            .print-vaf { border: 3px solid #3b82f6 !important; background: #fff !important; padding: 25px !important; }
            .print-vaf h3, .print-vaf span, .print-vaf p { color: #1e3a8a !important; }
            .print-vaf-text { color: #333 !important; }
            .print-vaf-result { border: 1px solid #cbd5e1 !important; box-shadow: none !important; background: #f8fafc !important; }
            .print-chart { height: 250px !important; page-break-inside: avoid !important; break-inside: avoid !important; }
            .recharts-wrapper { margin: 0 auto !important; }
          }
        `}
      </style>

      <div className="content-wrapper" style={{ width: '100%', maxWidth: '1600px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#004080', margin: '0', fontSize: '32px', fontWeight: '800', letterSpacing: '-1px' }}>AUDITTUS</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '16px', fontWeight: '500' }}>Inteligência Fiscal e Validação</p>
        </div>

        {status !== 'sucesso' && (
          <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '50px', backgroundColor: '#fff', borderRadius: '20px', border: '3px dashed #004080', textAlign: 'center', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' }}>
            <input type="file" accept=".txt" onChange={processarArquivo} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            {status === 'aguardando' && <UploadCloud size={64} color="#004080" style={{ marginBottom: '20px', opacity: 0.8 }} />}
            {status === 'processando' && <AlertCircle size={64} color="#F59E0B" style={{ marginBottom: '20px', animation: 'spin 2s linear infinite' }} />}
            <h2 style={{ margin: '0', color: '#004080', fontSize: '24px' }}>{mensagem}</h2>
          </div>
        )}

        {status === 'sucesso' && (
          <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
            
            <div className="print-dashboard-area" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              
              {/* BANNER DA EMPRESA */}
              <div className="print-banner" style={{ backgroundColor: '#004080', color: '#fff', padding: '20px 30px', borderRadius: '20px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0, 64, 128, 0.15)', WebkitPrintColorAdjust: 'exact' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <Building2 size={40} style={{ opacity: 0.9 }} />
                  <div>
                    <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '700' }}>{dadosEmpresa.nome}</h2>
                    <span style={{ fontSize: '15px', opacity: 0.8, fontFamily: 'monospace' }}>CNPJ: {dadosEmpresa.cnpj}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '12px', textTransform: 'uppercase', opacity: 0.8, marginBottom: '4px', fontWeight: '600' }}><Calendar size={14}/> Período de Apuração</span>
                  <strong style={{ fontSize: '18px', letterSpacing: '0.5px' }}>{dadosEmpresa.periodo}</strong>
                </div>
              </div>

              {/* LINHA 1: GRID TRIPLO */}
              <div className="print-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', gap: '25px', alignItems: 'stretch', marginBottom: '25px' }}>
                <div className="print-card" style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: '#004080', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px', margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><ArrowRightLeft size={24}/> Volume de Operações</h3>
                  <div className="print-chart" style={{ height: '300px', width: '100%', flexGrow: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={dadosGraficoOperacoes} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" animationDuration={1500}>{dadosGraficoOperacoes.map((entry, index) => <Cell key={`cell-op-${index}`} fill={CORES_OPERACOES[index % CORES_OPERACOES.length]} />)}</Pie><Tooltip formatter={(value) => formatarMoeda(value)} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} /><Legend verticalAlign="bottom" height={36} iconType="circle" /></PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="print-card" style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: '#004080', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px', margin: '0 0 20px 0', fontSize: '20px' }}>Resumo por CFOP</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flexGrow: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ color: '#10b981', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingDown size={18}/> Entradas</h4>
                      <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '5px' }}>
                        {listaCfops.entradas.length > 0 ? listaCfops.entradas.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #f0f4f8', fontSize: '14px' }}><span style={{ fontWeight: 'bold', color: '#555' }}>{item.cfop}</span><span style={{ color: '#10b981', fontWeight: '600' }}>{formatarMoeda(item.valor)}</span></div>
                        )) : <p style={{ fontSize: '13px', color: '#999' }}>Sem entradas.</p>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #f0f4f8', paddingLeft: '20px' }}>
                      <h4 style={{ color: '#4f46e5', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={18}/> Saídas</h4>
                      <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '5px' }}>
                        {listaCfops.saidas.length > 0 ? listaCfops.saidas.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #f0f4f8', fontSize: '14px' }}><span style={{ fontWeight: 'bold', color: '#555' }}>{item.cfop}</span><span style={{ color: '#4f46e5', fontWeight: '600' }}>{formatarMoeda(item.valor)}</span></div>
                        )) : <p style={{ fontSize: '13px', color: '#999' }}>Sem saídas.</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="print-vaf" style={{ background: 'linear-gradient(135deg, #004080 0%, #0284c7 100%)', padding: '30px', borderRadius: '20px', boxShadow: '0 15px 35px rgba(2, 132, 199, 0.3)', display: 'flex', flexDirection: 'column', color: '#fff', WebkitPrintColorAdjust: 'exact' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '15px', marginBottom: '20px' }}><h3 style={{ margin: 0, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}><Calculator size={26}/> VAF Fiscal do Período</h3></div>
                  <div className="print-vaf-text" style={{ display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '10px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}><Plus size={16}/> Saídas Brutas</span><strong style={{ fontSize: '16px' }}>{formatarMoeda(dadosVaf.saidasBrutas)}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '10px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#fca5a5' }}><Minus size={16}/> Dev. Vendas</span><strong style={{ fontSize: '16px', color: '#fca5a5' }}>{formatarMoeda(dadosVaf.devVendas)}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '10px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}><Minus size={16}/> Entradas Brutas</span><strong style={{ fontSize: '16px' }}>{formatarMoeda(dadosVaf.entradasBrutas)}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px 15px', borderRadius: '10px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#6ee7b7' }}><Plus size={16}/> Dev. Compras</span><strong style={{ fontSize: '16px', color: '#6ee7b7' }}>{formatarMoeda(dadosVaf.devCompras)}</strong></div>
                  </div>
                  <div className="print-vaf-result" style={{ backgroundColor: '#fff', color: '#004080', padding: '20px', borderRadius: '15px', textAlign: 'center', marginTop: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.15)' }}><p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}><Equal size={16}/> Valor Adicionado Gerado</p><h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-1px' }}>{formatarMoeda(dadosVaf.vafTotal)}</h2></div>
                </div>
              </div>

              {/* LINHA 2: APURAÇÃO ICMS */}
              <div className="print-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', alignItems: 'stretch' }}>
                <div className="print-card" style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: '#004080', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px', margin: '0 0 20px 0', fontSize: '20px' }}>Apuração de ICMS</h3>
                  <div className="print-chart" style={{ height: '300px', width: '100%', flexGrow: 1 }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dadosGraficoIcms} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" animationDuration={1500}>{dadosGraficoIcms.map((entry, index) => <Cell key={`cell-icms-${index}`} fill={CORES_ICMS[index % CORES_ICMS.length]} />)}</Pie><Tooltip formatter={(value) => formatarMoeda(value)} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} /><Legend verticalAlign="bottom" height={36} iconType="circle" /></PieChart></ResponsiveContainer></div>
                </div>

                <div className="print-flex-col" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                  <div className="print-flex-col" style={{ display: 'flex', gap: '20px', width: '100%' }}>
                    <div className="print-card" style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '20px', borderLeft: '6px solid #10b981', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}><p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Saldo Credor Transportar</p><h2 style={{ margin: 0, color: '#10b981', fontSize: '24px', fontWeight: '800' }}>{formatarMoeda(resumoIcms.saldoCredor)}</h2></div>
                    <div className="print-card" style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '20px', borderLeft: '6px solid #ef4444', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}><p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>ICMS a Recolher</p><h2 style={{ margin: 0, color: '#ef4444', fontSize: '24px', fontWeight: '800' }}>{formatarMoeda(resumoIcms.icmsRecolher)}</h2></div>
                  </div>

                  <div className="print-card" style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', width: '100%' }}>
                    <h3 style={{ color: '#004080', borderBottom: '2px solid #f0f4f8', paddingBottom: '10px', margin: '0 0 15px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}><DollarSign size={20} /> Obrigações</h3>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {guiasE116.length > 0 ? guiasE116.map((guia, index) => (
                        <div key={index} style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Cód: {guia.codigo}</span><span style={{ fontSize: '12px', color: '#555' }}><Calendar size={12}/> Vencto: {guia.vencimento}</span></div><span style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '16px' }}>{formatarMoeda(guia.valor)}</span></div>
                      )) : <p style={{ fontSize: '13px', color: '#999', textAlign: 'center' }}>Sem guias.</p>}
                    </div>
                  </div>

                  <div className="print-card" style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', width: '100%' }}>
                     <h3 style={{ color: '#004080', borderBottom: '2px solid #f0f4f8', paddingBottom: '10px', margin: '0 0 15px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}><FileText size={20}/> Ajustes</h3>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {ajustesICMS.length > 0 ? ajustesICMS.map((ajuste, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #f0f4f8', fontSize: '14px' }}><div><span style={{ display: 'block', fontWeight: 'bold', color: '#333' }}>{ajuste.descricao}</span><span style={{ fontSize: '11px', color: '#666' }}>Cód: {ajuste.codigo}</span></div><span style={{ fontWeight: 'bold', color: '#004080' }}>{formatarMoeda(ajuste.valor)}</span></div>
                      )) : <p style={{ fontSize: '13px', color: '#999', textAlign: 'center' }}>Nenhum ajuste.</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* LINHA 3: TOP 10 PRODUTOS E TOP 5 FORNECEDORES (O BI EM AÇÃO) */}
              <div className="print-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '25px', alignItems: 'stretch', marginTop: '25px' }}>
                
                <div className="print-card" style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: '#004080', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px', margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Package size={24}/> Top 10 Produtos Mais Vendidos
                  </h3>
                  <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '5px' }}>
                    {topProdutos.length > 0 ? topProdutos.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 10px', borderBottom: '1px solid #f0f4f8', backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                          <span style={{ backgroundColor: '#10b981', color: '#fff', minWidth: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', fontSize: '12px', fontWeight: 'bold' }}>{idx + 1}</span>
                          <span style={{ fontWeight: '600', color: '#444', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }} title={item.nome}>{item.nome}</span>
                        </div>
                        <span style={{ color: '#10b981', fontWeight: '700', fontSize: '15px', marginLeft: '10px' }}>{formatarMoeda(item.valor)}</span>
                      </div>
                    )) : <p style={{ fontSize: '13px', color: '#999', textAlign: 'center', marginTop: '20px' }}>Nenhum detalhamento de produto (C170) encontrado.</p>}
                  </div>
                </div>

                <div className="print-card" style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: '#004080', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px', margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Truck size={24}/> Top 5 Maiores Fornecedores
                  </h3>
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

              {/* BARRA DE AÇÕES INFERIOR */}
              <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <button onClick={baixarArquivo} style={{ padding: '15px 25px', backgroundColor: '#004080', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.3s' }}>
                  <Download size={20} /> 1. Baixar SPED Validado
                </button>
                <button onClick={gerarPDF} style={{ padding: '15px 25px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.3s' }}>
                  <Printer size={20} /> 2. Salvar Relatório (PDF)
                </button>
                <button onClick={limparDados} style={{ padding: '15px 25px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.3s' }}>
                  <RefreshCw size={20} /> 3. Limpar / Nova Validação
                </button>
              </div>

            </div>

            {/* PAINEL LATERAL DE AUDITORIA (INVISÍVEL NO PDF) */}
            <div className="no-print" style={{ width: '320px', flexShrink: 0, backgroundColor: '#fff', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', position: 'sticky', top: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '2px solid #f0f4f8', paddingBottom: '20px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#10b981', padding: '12px', borderRadius: '12px', display: 'flex', color: '#fff' }}><Shield size={28} /></div>
                <div><h3 style={{ margin: 0, color: '#004080', fontSize: '18px', fontWeight: '800' }}>Auditoria e Limpeza</h3><p style={{ margin: '2px 0 0 0', color: '#666', fontSize: '13px' }}>Ajustes automáticos</p></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}><span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: '600' }}>Registros C191 Removidos</span><strong style={{ fontSize: '22px', color: '#3b82f6' }}>{relatorioCorrecoes.c191Removidos}</strong></div>
                <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}><span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: '600' }}>Registros C173 Removidos</span><strong style={{ fontSize: '22px', color: '#3b82f6' }}>{relatorioCorrecoes.c173Removidos}</strong></div>
                <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}><span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: '600' }}>Termos Proibidos Limpos</span><strong style={{ fontSize: '22px', color: '#f59e0b' }}>{relatorioCorrecoes.textosRemovidos}</strong><span style={{ display: 'block', fontSize: '11px', color: '#999', marginTop: '4px' }}>Ex: ISENTO, Zeros, Sem GTIN</span></div>
                <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}><span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: '600' }}>Totalizadores Corrigidos</span><strong style={{ fontSize: '22px', color: '#10b981' }}>{relatorioCorrecoes.blocosRecalculados}</strong><span style={{ display: 'block', fontSize: '11px', color: '#999', marginTop: '4px' }}>C990, 9990, 9999</span></div>
              </div>
              <div style={{ marginTop: '25px', backgroundColor: '#004080', padding: '20px', borderRadius: '15px', textAlign: 'center', color: '#fff', boxShadow: '0 5px 15px rgba(0,64,128,0.2)' }}><span style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.8, marginBottom: '5px', fontWeight: '600' }}>Total de Intervenções</span><strong style={{ fontSize: '36px', fontWeight: '900' }}>{relatorioCorrecoes.c191Removidos + relatorioCorrecoes.c173Removidos + relatorioCorrecoes.textosRemovidos + relatorioCorrecoes.blocosRecalculados}</strong></div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}