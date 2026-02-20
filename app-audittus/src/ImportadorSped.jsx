import React, { useState, useRef } from 'react';

export default function ImportadorSped() {
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [urlDownload, setUrlDownload] = useState(null);
  
  const inputArquivoRef = useRef(null);

  // NOVA FUNÇÃO: Força o arquivo a ser salvo como ANSI (Windows-1252) para o PVA ler os acentos corretamente
  const converterParaANSI = (texto) => {
    const buffer = new Uint8Array(texto.length);
    for (let i = 0; i < texto.length; i++) {
      const codigo = texto.charCodeAt(i);
      // Se for um caractere padrão do Português/ANSI, mantém. Se for emoji ou símbolo não suportado, vira interrogação.
      buffer[i] = codigo <= 255 ? codigo : 63; 
    }
    return buffer;
  };

  const processarArquivo = (event) => {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    setProcessando(true);
    setProgresso(0);
    setMensagemSucesso(null);
    
    if (urlDownload) {
      URL.revokeObjectURL(urlDownload);
      setUrlDownload(null);
    }

    const reader = new FileReader();
    // Lê o arquivo original no formato do Domínio
    reader.readAsText(arquivo, 'windows-1252');

    reader.onload = (e) => {
      const conteudo = e.target.result;
      const linhas = conteudo.split(/\r?\n/);
      const totalLinhas = linhas.length;
      
      const termosRemover = [
        'ISENTO', '0000000', '1111111', '9999999', 
        '1500300', '0300200', '0300100', 'SEM GTIN'
      ];

      let linhasProcessadas = [];
      let contadorC191 = 0;
      let contadorTermos = 0;
      let removeu9900C191 = 0;
      let index = 0;
      const tamanhoLote = 5000;

      const processarLote = () => {
        const fim = Math.min(index + tamanhoLote, totalLinhas);

        for (let i = index; i < fim; i++) {
          let linha = linhas[i];
          
          if (linha.startsWith('|C191|')) {
            contadorC191++;
            continue; 
          }

          if (linha.startsWith('|9900|C191|')) {
            removeu9900C191 = 1;
            continue;
          }

          if (linha.startsWith('|C990|')) {
            let campos = linha.split('|');
            let totalAntigo = parseInt(campos[2], 10);
            campos[2] = (totalAntigo - contadorC191).toString();
            linhasProcessadas.push(campos.join('|'));
            continue;
          }

          if (linha.startsWith('|9990|')) {
            let campos = linha.split('|');
            let totalAntigo = parseInt(campos[2], 10);
            campos[2] = (totalAntigo - removeu9900C191).toString();
            linhasProcessadas.push(campos.join('|'));
            continue;
          }

          if (linha.startsWith('|9999|')) {
            let campos = linha.split('|');
            let totalAntigo = parseInt(campos[2], 10);
            campos[2] = (totalAntigo - contadorC191 - removeu9900C191).toString();
            linhasProcessadas.push(campos.join('|'));
            continue;
          }

          let campos = linha.split('|');
          for (let j = 0; j < campos.length; j++) {
            if (termosRemover.includes(campos[j].trim())) {
              campos[j] = ''; 
              contadorTermos++;
            }
          }

          linhasProcessadas.push(campos.join('|'));
        }

        index = fim;
        
        const porcentagemAtual = Math.round((index / totalLinhas) * 100);
        setProgresso(porcentagemAtual);

        if (index < totalLinhas) {
          setTimeout(processarLote, 0);
        } else {
          finalizarProcessamento(linhasProcessadas, contadorC191, contadorTermos);
        }
      };

      processarLote();
    };
  };

  const finalizarProcessamento = (linhasProcessadas, contadorC191, contadorTermos) => {
    // IMPORTANTE: Junta usando \r\n (Padrão Windows) em vez de apenas \n
    const arquivoFinal = linhasProcessadas.join('\r\n');
    
    // Converte o texto para a matriz de bytes em ANSI antes de criar o arquivo
    const bytesFinais = converterParaANSI(arquivoFinal);
    const blob = new Blob([bytesFinais], { type: 'text/plain' });
    
    const url = URL.createObjectURL(blob);
    
    setUrlDownload(url);
    setProcessando(false);
    setMensagemSucesso(`✅ Sucesso! ${contadorC191} registros C191 removidos. Totalizadores (C990, 9990 e 9999) recalculados perfeitamente.`);
  };

  const limparTela = () => {
    if (urlDownload) {
      URL.revokeObjectURL(urlDownload);
      setUrlDownload(null);
    }
    setMensagemSucesso(null);
    setProgresso(0);
    
    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = '';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '700px' }}>
      <h2>Otimizador de SPED Fiscal</h2>
      <p style={{ color: '#555' }}>
        Importe seu Arquivo para a Correção Automática Inteligente de Validação do SPED Fiscal - EFD ICMS/IPI.
      </p>
      
      <div style={{ margin: '20px 0', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label 
          style={{
            backgroundColor: processando ? '#6c757d' : '#0056b3',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: processando ? 'wait' : 'pointer',
            display: 'inline-block',
            fontWeight: 'bold',
            transition: '0.3s'
          }}
        >
          {processando ? `Lendo Arquivo... ${progresso}%` : 'Importar SPED (.txt)'}
          <input 
            type="file" 
            accept=".txt" 
            onChange={processarArquivo} 
            disabled={processando}
            style={{ display: 'none' }} 
            ref={inputArquivoRef} 
          />
        </label>

        {urlDownload && !processando && (
          <>
            <a 
              href={urlDownload} 
              download="SPED_AUDITTUS_LIMPO.txt"
              style={{
                backgroundColor: '#28a745',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block',
                transition: '0.3s'
              }}
            >
              📥 Baixar Arquivo Corrigido
            </a>

            <button
              onClick={limparTela}
              style={{
                backgroundColor: '#dc3545',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'inline-block',
                transition: '0.3s'
              }}
            >
              🧹 Limpar Tela
            </button>
          </>
        )}
      </div>

      {processando && (
        <div style={{ width: '100%', backgroundColor: '#e9ecef', borderRadius: '8px', overflow: 'hidden', marginTop: '15px', height: '20px' }}>
          <div 
            style={{
              width: `${progresso}%`,
              backgroundColor: '#007bff',
              height: '100%',
              transition: 'width 0.1s linear',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            {progresso > 5 ? `${progresso}%` : ''} 
          </div>
        </div>
      )}

      {mensagemSucesso && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          borderRadius: '8px', 
          border: '1px solid #c3e6cb',
          fontWeight: '500',
          marginTop: '15px'
        }}>
          {mensagemSucesso}
        </div>
      )}
    </div>
  );
}