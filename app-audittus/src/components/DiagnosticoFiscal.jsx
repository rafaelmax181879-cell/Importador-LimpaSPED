import React, { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Cell, Pie, PieChart } from 'recharts'
import jsPDF from 'jspdf'
import { useAuth } from '../AuthContext'

const parseSpedNumber = (value) => {
  const raw = `${value ?? ''}`.trim()
  if (!raw) return 0
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw
  const n = Number.parseFloat(normalized)
  return Number.isFinite(n) ? n : 0
}

const formatBRL = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

const UF_FROM_IBGE_PREFIX = {
  '11': 'RO',
  '12': 'AC',
  '13': 'AM',
  '14': 'RR',
  '15': 'PA',
  '16': 'AP',
  '17': 'TO',
  '21': 'MA',
  '22': 'PI',
  '23': 'CE',
  '24': 'RN',
  '25': 'PB',
  '26': 'PE',
  '27': 'AL',
  '28': 'SE',
  '29': 'BA',
  '31': 'MG',
  '32': 'ES',
  '33': 'RJ',
  '35': 'SP',
  '41': 'PR',
  '42': 'SC',
  '43': 'RS',
  '50': 'MS',
  '51': 'MT',
  '52': 'GO',
  '53': 'DF',
}

const getUfSiglaFromCodMun = (codMun) => {
  const digits = `${codMun || ''}`.replace(/\D/g, '')
  if (digits.length < 2) return ''
  return UF_FROM_IBGE_PREFIX[digits.substring(0, 2)] || ''
}

const calcularAliquotaInter = ({ cst, ufOrigem }) => {
  const c = `${cst || ''}`.trim()
  const first = c ? c[0] : ''
  if (['1', '2', '3', '8'].includes(first)) return { aliq: 0.04, tipo: 'Importado' }
  const uf = `${ufOrigem || ''}`.trim().toUpperCase()
  const sulSudesteExcetoES = new Set(['PR', 'SC', 'RS', 'SP', 'RJ', 'MG'])
  if (sulSudesteExcetoES.has(uf)) return { aliq: 0.07, tipo: 'Nacional' }
  return { aliq: 0.12, tipo: 'Nacional' }
}

const calcularDifalRoBaseDupla = ({ valorNota, aliquotaInter }) => {
  const v = Number.isFinite(valorNota) ? valorNota : 0
  const aInter = Number.isFinite(aliquotaInter) ? aliquotaInter : 0
  if (v <= 0) return { difal: 0, baseDupla: 0 }
  const baseDupla = v / 0.805
  const icmsInterno = baseDupla * 0.195
  const icmsOrigemCalc = v * aInter
  const difal = Number((icmsInterno - icmsOrigemCalc).toFixed(2))
  return { difal: Number.isFinite(difal) ? difal : 0, baseDupla }
}

export default function DiagnosticoFiscal({ arquivoProcessado, dadosEmpresa }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [lastResumo, setLastResumo] = useState(null)
  const [erro, setErro] = useState('')
  const [runId, setRunId] = useState(0)
  const [animatedPct, setAnimatedPct] = useState(0)

  const canRun = useMemo(() => !!arquivoProcessado && `${arquivoProcessado}`.length > 10, [arquivoProcessado])

  const buildDiagnostics = () => {
    const linhas = `${arquivoProcessado || ''}`.split(/\r?\n/)

    const partMap = new Map()
    const fornecedorNomePorCnpj = new Map()
    const itemMap = new Map()

    for (const line of linhas) {
      if (!line.startsWith('|')) continue
      const cols = line.split('|')
      const reg = cols[1]
      if (reg === '0150') {
        const codPart = (cols[2] || '').trim()
        if (!codPart) continue
        const nome = (cols[3] || '').trim()
        const cnpj = (cols[5] || '').replace(/\D/g, '')
        const codMun = cols[8] || ''
        const uf = getUfSiglaFromCodMun(codMun)
        partMap.set(codPart, { nome, cnpj, uf })
      }
      if (reg === '0200') {
        const codItem = (cols[2] || '').trim()
        if (!codItem) continue
        const descr = (cols[3] || '').trim()
        const ncm = (cols[8] || '').trim()
        itemMap.set(codItem, { descr, ncm })
      }
    }

    let totalCompras = 0
    let totalComprasRO = 0
    let totalComprasInter = 0

    const comprasPorFornecedor = new Map()
    const creditosPorNcm = new Map()

    const difalCfops = new Set(['2556', '2407', '2551', '2102', '2557'])
    let totalDifalEstimado = 0

    let nota = null

    const closeNota = () => {
      if (!nota) return

      if (nota.isCompra) {
        totalCompras += nota.vlDoc
        if (nota.ufOrigem === 'RO') totalComprasRO += nota.vlDoc
        else totalComprasInter += nota.vlDoc

        if (nota.fornecedorCnpj) {
          if (nota.fornecedorNome) fornecedorNomePorCnpj.set(nota.fornecedorCnpj, nota.fornecedorNome)
          comprasPorFornecedor.set(
            nota.fornecedorCnpj,
            (comprasPorFornecedor.get(nota.fornecedorCnpj) || 0) + nota.vlDoc,
          )
        }

        const isDifalTarget = nota.cfops.size > 0
        if (isDifalTarget && nota.ufOrigem && nota.ufOrigem !== 'RO') {
          const { aliq } = calcularAliquotaInter({ cst: nota.cst, ufOrigem: nota.ufOrigem })
          const calc = calcularDifalRoBaseDupla({ valorNota: nota.vlDoc, aliquotaInter: aliq })
          if (calc.difal > 0) totalDifalEstimado += calc.difal
        }
      }

      nota = null
    }

    for (let i = 0; i < linhas.length; i++) {
      const line = linhas[i]
      if (!line.startsWith('|')) continue
      const cols = line.split('|')
      const reg = cols[1]

      if (reg === 'C100') {
        closeNota()

        const indOper = (cols[2] || '').trim()
        const codPart = (cols[4] || '').trim()
        const vlDoc = parseSpedNumber(cols[12])

        const part = partMap.get(codPart) || {}
        nota = {
          isCompra: indOper === '0',
          codPart,
          fornecedorCnpj: part.cnpj || '',
          fornecedorNome: part.nome || '',
          ufOrigem: part.uf || '',
          vlDoc,
          cfops: new Set(),
          cst: '',
        }
        continue
      }

      if (!nota) continue

      if (reg && !reg.startsWith('C')) {
        closeNota()
        continue
      }

      if (reg === 'C170') {
        const cfop = (cols[11] || '').trim()
        if (difalCfops.has(cfop)) nota.cfops.add(cfop)

        const cst = (cols[10] || '').trim()
        if (!nota.cst && cst) nota.cst = cst

        if (nota.isCompra) {
          const codItem = (cols[3] || '').trim()
          const ncm = itemMap.get(codItem)?.ncm || 'Sem NCM'
          const vlIcms = parseSpedNumber(cols[15])
          if (vlIcms > 0) creditosPorNcm.set(ncm, (creditosPorNcm.get(ncm) || 0) + vlIcms)
        }
      }

      if (reg === 'C190') {
        const cfop = (cols[3] || '').trim()
        if (difalCfops.has(cfop)) nota.cfops.add(cfop)

        const cst = (cols[2] || '').trim()
        if (!nota.cst && cst) nota.cst = cst
      }
    }

    closeNota()

    const fornecedores = Array.from(comprasPorFornecedor.entries())
      .map(([cnpj, valor]) => ({ cnpj, valor, nome: fornecedorNomePorCnpj.get(cnpj) || '' }))
      .sort((a, b) => b.valor - a.valor)

    const topFornecedor = fornecedores[0] || { cnpj: '', valor: 0, nome: '' }
    const topFornecedorPerc = totalCompras > 0 ? topFornecedor.valor / totalCompras : 0
    const alertaConcentracao = topFornecedorPerc > 0.6

    const ncmList = Array.from(creditosPorNcm.entries())
      .map(([ncm, valor]) => ({ ncm, valor }))
      .sort((a, b) => b.valor - a.valor)

    const topNcm = ncmList[0] || { ncm: '', valor: 0 }

    const difalImpactPerc = totalComprasInter > 0 ? totalDifalEstimado / totalComprasInter : 0

    return {
      concentracao: {
        alerta: alertaConcentracao,
        topFornecedorCnpj: topFornecedor.cnpj,
        topFornecedorNome: topFornecedor.nome,
        topPerc: topFornecedorPerc,
      },
      creditos: { topNcm: topNcm.ncm, topValor: topNcm.valor },
      difalSaude: { comprasRO: totalComprasRO, comprasInter: totalComprasInter, difalEstimado: totalDifalEstimado, difalPerc: difalImpactPerc },
    }
  }

  const gerarPdf = (diagnostico) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    doc.setFont('helvetica', 'normal')

    const left = 14
    let y = 18
    const pageWidth = doc.internal.pageSize.getWidth()
    const footerY = 282
    const footerWidth = 196 - left

    const addFooter = () => {
      doc.setFillColor(30, 64, 175)
      doc.rect(left, footerY, footerWidth, 1.6, 'F')

      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      const nomeColab = `${user?.nome_completo || ''}`.trim()
      const cargoColab = `${user?.cargo || ''}`.trim()
      doc.text(nomeColab, left, footerY + 7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(71, 85, 105)
      doc.setFontSize(9)
      doc.text(cargoColab, left, footerY + 11)

      doc.setTextColor(148, 163, 184)
      doc.setFontSize(7)
      const aviso = 'Este diagnóstico é gerado com base no arquivo fiscal fornecido e visa apoiar decisões gerenciais.'
      const avisoLines = doc.splitTextToSize(aviso, footerWidth)
      doc.text(avisoLines, left, footerY + 15)
    }

    doc.setFontSize(14)
    doc.setTextColor(15, 23, 42)
    doc.text('Diagnóstico Fiscal Inteligente', left, y)

    y += 8
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.4)
    doc.line(left, y, 196, y)

    y += 8
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    const empresaNome = `${dadosEmpresa?.nome || ''}`.trim() || 'Empresa Auditada'
    const empresaCnpj = `${dadosEmpresa?.cnpj || ''}`.trim()
    const empresaPeriodo = `${dadosEmpresa?.periodo || ''}`.trim()
    doc.text(`Empresa: ${empresaNome}`, left, y)
    y += 5
    if (empresaCnpj) {
      doc.text(`CNPJ: ${empresaCnpj}`, left, y)
      y += 5
    }
    if (empresaPeriodo) {
      doc.text(`Período: ${empresaPeriodo}`, left, y)
      y += 5
    }

    y += 5
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)

    const conc = diagnostico.concentracao
    const concPerc = `${Math.round((conc.topPerc || 0) * 100)}%`
    const fornecedorNome = `${conc.topFornecedorNome || ''}`.trim()
    const fornecedorCnpj = `${conc.topFornecedorCnpj || ''}`.trim()
    const fornecedorLabel = fornecedorNome && fornecedorCnpj ? `${fornecedorNome} (CNPJ ${fornecedorCnpj})` : (fornecedorNome || fornecedorCnpj || 'Fornecedor líder')
    const textoConc = conc.alerta
      ? `Análise de Dependência: No período analisado, ${concPerc} do volume de compras concentrou-se em ${fornecedorLabel}. Acima de 60%, esse nível de concentração sugere dependência comercial/operacional. Recomenda-se revisar condições, prazos e alternativas de suprimento para reduzir risco e melhorar poder de negociação.`
      : `Análise de Dependência: O maior fornecedor representa ${concPerc} do volume de compras (${fornecedorLabel}). O indicador sinaliza uma distribuição mais equilibrada, com menor exposição a dependência de um único parceiro.`

    const cred = diagnostico.creditos
    const textoCred = cred.topNcm
      ? `Oportunidade de Créditos: A principal classificação fiscal (NCM ${cred.topNcm}) concentrou ${formatBRL(cred.topValor)} em créditos de ICMS no período. Recomenda-se revisar cadastro e parametrizações fiscais de compra (NCM/CST/alíquotas) para garantir consistência do crédito e capturar oportunidades com segurança.`
      : `Oportunidade de Créditos: Não foi possível identificar uma classificação fiscal predominante para crédito de ICMS com base nos valores informados. Recomenda-se validar o preenchimento de ICMS nos itens e a consistência do cadastro fiscal para evitar perda de crédito por inconsistências.`

    const dif = diagnostico.difalSaude
    const difPerc = `${(dif.difalPerc * 100).toFixed(2)}%`
    const textoDifal = `Impacto de Compras Interestaduais: Compras internas (RO) totalizaram ${formatBRL(dif.comprasRO)} e compras de outros estados totalizaram ${formatBRL(dif.comprasInter)}. Pelo modelo de cálculo com alíquota interna de 19,5%, o impacto estimado do diferencial de alíquota (DIFAL) sobre aquisições fora do estado é de ${formatBRL(dif.difalEstimado)} (≈ ${difPerc} do valor de outros estados). Esse diferencial tende a elevar o custo efetivo de compra; priorize análise de origem e estratégia de suprimento para otimizar a relação custo-benefício.`

    const wrap = (text, maxWidth) => doc.splitTextToSize(text, maxWidth)

    const drawDonut = ({ cx, cy, outerR, innerR, slices, centerText }) => {
      const toRad = (deg) => (deg * Math.PI) / 180
      const polar = (r, deg) => [cx + r * Math.cos(toRad(deg)), cy + r * Math.sin(toRad(deg))]

      doc.setDrawColor(241, 245, 249)
      doc.setFillColor(241, 245, 249)
      doc.circle(cx, cy, outerR, 'F')
      doc.setFillColor(255, 255, 255)
      doc.circle(cx, cy, innerR, 'F')

      const startDeg = -90
      const step = 2
      let current = startDeg

      const normalized = (slices || [])
        .map((s) => ({ ...s, value: Math.max(0, Number.isFinite(s.value) ? s.value : 0) }))
        .filter((s) => s.value > 0)

      const total = normalized.reduce((acc, s) => acc + s.value, 0) || 1
      const parts = normalized.map((s) => ({ ...s, value: s.value / total }))

      for (const s of parts) {
        const span = 360 * s.value
        const end = current + span
        const [r, g, b] = s.color
        doc.setFillColor(r, g, b)
        doc.setDrawColor(r, g, b)

        for (let a = current; a < end; a += step) {
          const a0 = a
          const a1 = Math.min(a + step, end)
          const [o0x, o0y] = polar(outerR, a0)
          const [o1x, o1y] = polar(outerR, a1)
          const [i0x, i0y] = polar(innerR, a0)
          const [i1x, i1y] = polar(innerR, a1)
          doc.triangle(o0x, o0y, o1x, o1y, i1x, i1y, 'F')
          doc.triangle(o0x, o0y, i1x, i1y, i0x, i0y, 'F')
        }

        const pct = Math.round(s.value * 100)
        if (pct >= 6) {
          const mid = current + span / 2
          const labelR = (innerR + outerR) / 2
          const [lx, ly] = polar(labelR, mid)
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(luminance < 0.55 ? 255 : 15, luminance < 0.55 ? 255 : 23, luminance < 0.55 ? 255 : 42)
          doc.text(`${pct}%`, lx, ly + 1, { align: 'center' })
        }

        current = end
      }

      doc.setFillColor(255, 255, 255)
      doc.circle(cx, cy, innerR, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(16)
      doc.text(centerText, cx, cy + 2, { align: 'center' })
    }

    const drawLegend = ({ x, y, width, slices }) => {
      const colW = width / 2
      const rowH = 7
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(51, 65, 85)

      for (let i = 0; i < slices.length; i++) {
        const s = slices[i]
        const col = i % 2
        const row = Math.floor(i / 2)
        const lx = x + col * colW
        const ly = y + row * rowH
        const [r, g, b] = s.color
        doc.setFillColor(r, g, b)
        doc.rect(lx, ly - 4, 4, 4, 'F')
        doc.text(s.label, lx + 7, ly - 1)
      }
      return y + Math.ceil(slices.length / 2) * rowH
    }

    const bloco = (titulo, texto) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(30, 64, 175)
      doc.text(titulo, left, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(51, 65, 85)
      const lines = wrap(texto, 182)
      doc.text(lines, left, y)
      y += lines.length * 5 + 6
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(30, 64, 175)
    doc.text('1) Dependência de Compras (Concentração)', left, y)

    const concPct = Math.max(0, Math.min(100, Math.round((conc.topPerc || 0) * 100)))
    const concSlices = [
      { label: 'Fornecedor líder', value: conc.topPerc || 0, color: [30, 64, 175] },
      { label: 'Demais fornecedores', value: 1 - (conc.topPerc || 0), color: [226, 232, 240] },
    ]

    const donutCx = pageWidth / 2
    const donutCy = y + 78
    drawDonut({ cx: donutCx, cy: donutCy, outerR: 70, innerR: 42, slices: concSlices, centerText: `${concPct}%` })
    y = donutCy + 70 + 12
    y = drawLegend({ x: left, y, width: footerWidth, slices: concSlices }) + 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(51, 65, 85)
    const concLines = wrap(textoConc, footerWidth)
    doc.text(concLines, left, y)
    y += concLines.length * 5 + 10

    addFooter()

    doc.addPage()
    y = 18
    doc.setFontSize(14)
    doc.setTextColor(15, 23, 42)
    doc.text('Diagnóstico Fiscal Inteligente', left, y)
    y += 8
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.4)
    doc.line(left, y, 196, y)
    y += 12

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(30, 64, 175)
    doc.text('2) Perfil de Compras (Origem)', left, y)

    const totalComprasOrigem = (dif.comprasRO || 0) + (dif.comprasInter || 0)
    const roPerc = totalComprasOrigem > 0 ? dif.comprasRO / totalComprasOrigem : 0
    const interPerc = totalComprasOrigem > 0 ? dif.comprasInter / totalComprasOrigem : 0
    const interPct = Math.max(0, Math.min(100, Math.round(interPerc * 100)))

    const origemSlices = [
      { label: 'Compras internas (RO)', value: roPerc, color: [22, 163, 74] },
      { label: 'Compras de outros estados', value: interPerc, color: [245, 158, 11] },
    ]

    const donutCy2 = y + 78
    drawDonut({ cx: donutCx, cy: donutCy2, outerR: 70, innerR: 42, slices: origemSlices, centerText: `${interPct}%` })
    y = donutCy2 + 70 + 12
    y = drawLegend({ x: left, y, width: footerWidth, slices: origemSlices }) + 10

    bloco('3) Oportunidade de Créditos', textoCred)
    bloco('4) Impacto de Compras Interestaduais', textoDifal)

    addFooter()

    doc.save(`diagnostico-fiscal-audittus.pdf`)
  }

  const handleGerar = async () => {
    if (!canRun || loading) return
    const nome = `${user?.nome_completo || ''}`.trim()
    const cargo = `${user?.cargo || ''}`.trim()
    if (!nome || !cargo) {
      setErro('Identidade do colaborador não encontrada. Verifique Nome Completo e Cargo no Supabase.')
      return
    }
    setErro('')
    setLoading(true)
    try {
      setRunId((v) => v + 1)
      const diagnostico = buildDiagnostics()
      setLastResumo(diagnostico)
      gerarPdf(diagnostico)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const target = Math.round(((lastResumo?.concentracao?.topPerc || 0) * 100))
    setAnimatedPct(0)
    if (!lastResumo) return

    const start = performance.now()
    const duration = 900

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimatedPct(Math.round(target * eased))
      if (t < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [runId, lastResumo])

  return (
    <div className="no-print" style={{ marginTop: 18 }}>
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-slate-900 font-extrabold text-base">Diagnóstico Fiscal Inteligente</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Geração manual do relatório em PDF com indicadores estratégicos.
          </div>
        </div>
        <button
          onClick={handleGerar}
          disabled={!canRun || loading}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 font-extrabold text-sm shadow-sm transition ${
            !canRun || loading ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Search size={18} className={loading ? 'animate-spin' : ''} />
          Gerar Diagnóstico
        </button>
      </div>

      {erro && (
        <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
          {erro}
        </div>
      )}

      {lastResumo && (
        <div className="mt-4 grid" style={{ gap: 12 }}>
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5">
            <div className="text-slate-900 font-extrabold text-sm">Prévia dos Indicadores</div>
            <div className="mt-4" style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, alignItems: 'center' }}>
              <div className="relative" style={{ width: 140, height: 140 }}>
                <PieChart width={140} height={140} key={runId}>
                  <Pie
                    data={[
                      { name: 'Fornecedor líder', value: Math.max(0, animatedPct) },
                      { name: 'Demais', value: Math.max(0, 100 - Math.max(0, animatedPct)) },
                    ]}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={62}
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive
                    animationDuration={900}
                    stroke="none"
                  >
                    <Cell fill="#1E40AF" />
                    <Cell fill="#E5E7EB" />
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-slate-900 font-extrabold text-2xl leading-none">{animatedPct}%</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-1">Concentração</div>
                </div>
              </div>
              <div className="text-sm text-slate-700">
              <div>
                <span className="font-bold">Análise de Dependência:</span>{' '}
                {Math.round((lastResumo.concentracao.topPerc || 0) * 100)}% no fornecedor líder
                {lastResumo.concentracao.alerta ? ' (alerta > 60%)' : ''}.
              </div>
              <div className="mt-1">
                <span className="font-bold">Oportunidade de Créditos:</span> NCM {lastResumo.creditos.topNcm || '--'}{' '}
                ({formatBRL(lastResumo.creditos.topValor || 0)}).
              </div>
              <div className="mt-1">
                <span className="font-bold">Impacto de Compras Interestaduais:</span>{' '}
                {formatBRL(lastResumo.difalSaude.difalEstimado || 0)} estimado sobre {formatBRL(lastResumo.difalSaude.comprasInter || 0)}.
              </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
