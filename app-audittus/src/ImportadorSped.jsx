import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Download, DollarSign, Calendar, Building2 } from 'lucide-react';

export default function ImportadorSped() {
  const [mensagem, setMensagem] = useState('Arraste seu arquivo SPED ou clique para selecionar');
  const [status, setStatus] = useState('aguardando'); 
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [ajustesICMS, setAjustesICMS] = useState([]);
  const [resumoIcms, setResumoIcms] = useState({ saldoCredor: 0, icmsRecolher: 0 });
  const [guiasE116, setGuiasE116] = useState([]);
  
  // NOVO: Estado para guardar os dados da Empresa (Registro 0000)
  const [dadosEmpresa, setDadosEmpresa] = useState({ nome: '', cnpj: '', periodo: '' });

  const [arquivoProcessado, setArquivoProcessado] = useState(null);
  const [nomeOriginal, setNomeOriginal] = useState('');

  const CORES = ['#004080', '#F59E0B']; 

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const processarArquivo = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setStatus('processando');
    setMensagem('Limpando registros e processando dados fiscais...');
    setNomeOriginal(file.name);
    
    // Limpa os dados da empresa anterior caso importe um novo arquivo
    setDadosEmpresa({ nome: '', cnpj: '', periodo: '' });

    const reader = new FileReader();
    reader.readAsText(file, 'windows-1252');

    reader.onload = (e) => {
      const conteudoArquivo = e.target.result;
      let linhasSped = conteudoArquivo.split(/\r?\n/);

      // --- LIMPEZA ---
      linhasSped = linhasSped.filter(linha => {
        const t = linha.trim();
        return t !== '' && !t.startsWith('|C191|') && !t.startsWith('|C173|');
      });
      const textosParaRemover = /\b(ISENTO|0000000|1111111|9999999|1500300|0300200|0300100|SEM GTIN|0500500|2003901|0300900|0301900|0112900|1800300)\b/gi;
      linhasSped = linhasSped.map(linha => linha.replace(textosParaRemover, ''));

      // --- EXTRAÇÃO DE DADOS ---
      let totalDebitos = 0; let totalCreditos = 0;
      let listaAjustes = []; let listaGuias = [];
      let saldoCredorFinal = 0; let icmsRecolherFinal = 0;

      linhasSped.forEach(linha => {
        const colunas = linha.split('|');
        
        // NOVO: Captura de Dados da Empresa (Registro 0000)
        if (colunas[1] === '0000') {
          const dtIni = colunas[4] || '';
          const dtFin = colunas[5] || '';
          const pFormatado = (dtIni.length === 8 && dtFin.length === 8) 
            ? `${dtIni.substring(0,2)}/${dtIni.substring(2,4)}/${dtIni.substring(4,8)} a ${dtFin.substring(0,2)}/${dtFin.substring(2,4)}/${dtFin.substring(4,8)}`
            : `${dtIni} a ${dtFin}`;

          let c = colunas[7] || '';
          const cnpjFormatado = c.length === 14 
            ? `${c.substring(0,2)}.${c.substring(2,5)}.${c.substring(5,8)}/${c.substring(8,12)}-${c.substring(12,14)}`
            : c;

          setDadosEmpresa({
            nome: colunas[6] || 'Razão Social Não Identificada',
            cnpj: cnpjFormatado,
            periodo: pFormatado
          });
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
          listaGuias.push({ codigo: colunas[2], valor: parseFloat(colunas[3].replace(',', '.')) || 0, vencimento: vencimentoFormatado });
        }
      });

      setDadosGrafico([{ name: 'Total de Créditos', value: totalCreditos }, { name: 'Total de Débitos', value: totalDebitos }]);
      setAjustesICMS(listaAjustes);
      setResumoIcms({ saldoCredor: saldoCredorFinal, icmsRecolher: icmsRecolherFinal });
      setGuiasE116(listaGuias);

      // --- CORREÇÃO DE LINHAS ---
      const totalC = linhasSped.filter(l => l.startsWith('|C')).length;
      const total9 = linhasSped.filter(l => l.startsWith('|9')).length;
      const totalGeral = linhasSped.length;
      const resultadoFinal = linhasSped.map(linha => {
        if (linha.startsWith('|C990|')) return `|C990|${totalC}|`;
        if (linha.startsWith('|9990|')) return `|9990|${total9}|`;
        if (linha.startsWith('|9999|')) return `|9999|${totalGeral}|`;
        return linha;
      }).join('\r\n');

      setArquivoProcessado(resultadoFinal);
      setStatus('sucesso');
      setMensagem('Auditoria concluída com sucesso!');
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
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '30px', boxSizing: 'border-box', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: '#333' }}>
      
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#004080', margin: '0', fontSize: '32px', fontWeight: '800', letterSpacing: '-1px' }}>AUDITTUS</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '16px', fontWeight: '500' }}>Inteligência Fiscal e Validação</p>
        </div>

        {status !== 'sucesso' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '50px', backgroundColor: '#fff', borderRadius: '20px', border: '3px dashed #004080', textAlign: 'center', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' }}>
            <input type="file" accept=".txt" onChange={processarArquivo} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            {status === 'aguardando' && <UploadCloud size={64} color="#004080" style={{ marginBottom: '20px', opacity: 0.8 }} />}
            {status === 'processando' && <AlertCircle size={64} color="#F59E0B" style={{ marginBottom: '20px', animation: 'spin 2s linear infinite' }} />}
            <h2 style={{ margin: '0', color: '#004080', fontSize: '24px' }}>{mensagem}</h2>
            {status === 'aguardando' && <p style={{ color: '#999', marginTop: '10px' }}>Suporta arquivos SPED Fiscal (.txt)</p>}
          </div>
        )}

        {status === 'sucesso' && (
          <div>
            {/* NOVO: BANNER DA EMPRESA (REGISTRO 0000) */}
            <div style={{ backgroundColor: '#004080', color: '#fff', padding: '20px 30px', borderRadius: '20px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0, 64, 128, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Building2 size={40} style={{ opacity: 0.9 }} />
                <div>
                  <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px' }}>{dadosEmpresa.nome}</h2>
                  <span style={{ fontSize: '15px', opacity: 0.8, fontFamily: 'monospace' }}>CNPJ: {dadosEmpresa.cnpj}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '12px', textTransform: 'uppercase', opacity: 0.8, marginBottom: '4px', fontWeight: '600' }}>
                  <Calendar size={14}/> Período de Apuração
                </span>
                <strong style={{ fontSize: '18px', letterSpacing: '0.5px' }}>{dadosEmpresa.periodo}</strong>
              </div>
            </div>

            {/* O Restante do Dashboard continua igual e centralizado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', alignItems: 'start' }}>
              
              {/* COLUNA DA ESQUERDA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ color: '#004080', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px', margin: '0 0 20px 0', fontSize: '20px' }}>Apuração de ICMS (E110)</h3>
                  <div style={{ height: '350px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dadosGrafico} cx="50%" cy="50%" innerRadius={90} outerRadius={140} paddingAngle={5} dataKey="value" animationDuration={1500}>
                          {dadosGrafico.map((entry, index) => <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => formatarMoeda(value)} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <button onClick={baixarArquivo} style={{ width: '100%', padding: '18px', marginTop: '20px', backgroundColor: '#004080', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', transition: 'background 0.3s', boxShadow: '0 5px 15px rgba(0, 64, 128, 0.2)' }}>
                    <Download size={24} /> Baixar Arquivo Validado
                  </button>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                   <h3 style={{ color: '#004080', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px', margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><FileText size={24}/> Detalhamento de Ajustes (E111)</h3>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '10px' }}>
                    {ajustesICMS.length > 0 ? ajustesICMS.map((ajuste, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '10px', borderLeft: `5px solid ${ajuste.codigo === 'RO020003' ? '#F59E0B' : '#004080'}` }}>
                        <div><span style={{ display: 'block', fontWeight: 'bold', fontSize: '15px', color: '#333' }}>{ajuste.descricao}</span><span style={{ fontSize: '13px', color: '#666', fontFamily: 'monospace' }}>Cód: {ajuste.codigo}</span></div>
                        <span style={{ fontWeight: 'bold', color: '#004080', fontSize: '16px' }}>{formatarMoeda(ajuste.valor)}</span>
                      </div>
                    )) : <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>Nenhum ajuste E111 encontrado.</p>}
                  </div>
                </div>
              </div>

              {/* COLUNA DA DIREITA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', height: '100%' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1, backgroundColor: '#fff', padding: '25px', borderRadius: '20px', borderLeft: '6px solid #10b981', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Saldo Credor a Transportar</p>
                    <h2 style={{ margin: 0, color: '#10b981', fontSize: '28px', fontWeight: '800' }}>{formatarMoeda(resumoIcms.saldoCredor)}</h2>
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#fff', padding: '25px', borderRadius: '20px', borderLeft: '6px solid #ef4444', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Total de ICMS a Recolher</p>
                    <h2 style={{ margin: 0, color: '#ef4444', fontSize: '28px', fontWeight: '800' }}>{formatarMoeda(resumoIcms.icmsRecolher)}</h2>
                  </div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: '#004080', borderBottom: '2px solid #f0f4f8', paddingBottom: '15px', margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <DollarSign size={24} /> Obrigações a Recolher (E116)
                  </h3>
                  <div style={{ overflowY: 'auto', paddingRight: '10px', flexGrow: 1 }}>
                    {guiasE116.length > 0 ? guiasE116.map((guia, index) => (
                      <div key={index} style={{ backgroundColor: '#fff', border: '2px solid #e2e8f0', padding: '20px', borderRadius: '15px', marginBottom: '15px', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div><span style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '5px' }}>Código da Obrigação</span><span style={{ fontWeight: 'bold', color: '#333', fontSize: '16px', fontFamily: 'monospace' }}>{guia.codigo}</span></div>
                          <span style={{ fontWeight: '800', color: '#ef4444', fontSize: '22px' }}>{formatarMoeda(guia.valor)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#555', fontSize: '14px', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', width: 'fit-content' }}>
                          <Calendar size={16} color="#004080" /> <strong>Vencimento:</strong> {guia.vencimento || 'N/A'}
                        </div>
                      </div>
                    )) : (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#999', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <CheckCircle size={48} style={{ marginBottom: '15px', opacity: 0.3, color: '#10b981' }} />
                        <p style={{ fontSize: '18px', fontWeight: '500' }}>Nenhuma guia a recolher (E116) identificada.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}