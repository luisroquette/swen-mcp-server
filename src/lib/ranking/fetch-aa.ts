/**
 * Data fetchers for the AA-style /ranking page.
 * Each function returns top-N rows for a specific bar chart.
 * Uses direct REST calls to keep ISR-friendly (cached by tag).
 */

import { filterFreshScores } from '@/lib/benchmark/freshness'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const fetchOptions: RequestInit = {
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  },
  // 5min ISR fallback; tag 'ranking-aa' permite invalidação granular via
  // /api/revalidate quando sync-benchmark-data ou snapshot-benchmark-scores rodam.
  next: { revalidate: 300, tags: ['ranking-aa'] },
}

export interface ModelInfo {
  id: string
  slug: string
  nome: string
  empresa: string
  logo_url: string | null
}

export interface ScoreRow {
  model_id: string
  score: number
}

export interface BenchmarkTopRow {
  slug: string
  nome: string
  empresa: string
  score: number
}

// ─── primitive fetchers ─────────────────────────────────────────────────────

async function fetchActiveModels(): Promise<ModelInfo[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_models?select=id,slug,nome,empresa,logo_url&status=eq.ativo&limit=1500`,
    fetchOptions,
  )
  if (!res.ok) return []
  return res.json()
}

/**
 * @param guardFreshness descarta órfãos stale (ver lib/benchmark/freshness.ts).
 *   true para benchmarks geridos pelo sync da AA; false para benchmarks manuais
 *   (LMArena Elo), que não têm data_teste mantida pelo sync.
 */
async function fetchBenchmarkScores(
  benchmarkName: string,
  limit = 100,
  guardFreshness = true,
): Promise<ScoreRow[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_benchmarks?select=model_id,score,data_teste&benchmark_nome=eq.${encodeURIComponent(benchmarkName)}&order=score.desc&limit=${limit}`,
    fetchOptions,
  )
  if (!res.ok) return []
  const rows: (ScoreRow & { data_teste?: string | null })[] = await res.json()
  return guardFreshness ? filterFreshScores(rows) : rows
}

/** Strip vendor prefix ("OpenAI: GPT-5" → "GPT-5") for display */
function cleanName(nome: string): string {
  return nome.replace(/^[^:]+:\s*/, '')
}

/**
 * Chave de família do modelo: nome sem prefixo de vendor e sem o sufixo
 * parentético de configuração ("GPT-5.6 Sol (max)" → "gpt-5.6 sol").
 * Regra editorial 17/07: o ranking exibe UMA entrada por modelo (a melhor
 * config), como o AA apresenta — variantes max/high/xhigh não inundam o topo.
 * MESMA regra vive no app iOS (swen-app/app/(tabs)/index.tsx) — mudar aqui
 * exige mudar lá (regression tests dos dois lados apontam um pro outro).
 */
export function familyKey(nome: string): string {
  return cleanName(nome).replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase()
}

/** Join scores with model info, return top-N */
function joinTop(scores: ScoreRow[], models: ModelInfo[], topN: number): BenchmarkTopRow[] {
  const modelById = new Map(models.map((m) => [m.id, m]))
  return scores
    .slice(0, topN * 3) // overshoot to filter out inactive
    .map((s) => {
      const m = modelById.get(s.model_id)
      if (!m) return null
      return {
        slug: m.slug,
        nome: cleanName(m.nome),
        empresa: m.empresa,
        score: s.score,
      } as BenchmarkTopRow
    })
    .filter((r): r is BenchmarkTopRow => r !== null)
    // Empate determinístico: score desc, nome asc — MESMA regra do app iOS.
    // Antes o empate ficava na ordem física do REST (não-determinística), e o
    // app resolvia por ELO: rankings divergiam em scores iguais (regra do
    // usuário 17/07: app e site DEVEM ser idênticos, cópia fiel do AA).
    .sort((a, b) => b.score - a.score || a.nome.localeCompare(b.nome))
    // Dedup por família: uma entrada por modelo, vence a melhor config
    // (lista já ordenada — a primeira ocorrência é a maior).
    .filter((() => {
      const seen = new Set<string>()
      return (r: BenchmarkTopRow) => {
        const k = familyKey(r.nome)
        if (seen.has(k)) return false
        seen.add(k)
        return true
      }
    })())
    .slice(0, topN)
}

// ─── public composite fetchers ──────────────────────────────────────────────

export interface RankingAAData {
  topIntelligence: BenchmarkTopRow[]
  topIntelligenceFull: BenchmarkTopRow[]
  topSpeed: BenchmarkTopRow[]
  topCheapest: BenchmarkTopRow[]
  topCoding: BenchmarkTopRow[]
  topLiveCodeBench: BenchmarkTopRow[]
  topGpqa: BenchmarkTopRow[]
  topHle: BenchmarkTopRow[]
  topMmluPro: BenchmarkTopRow[]
  topAime: BenchmarkTopRow[]
  topMath500: BenchmarkTopRow[]
  topMathIndex: BenchmarkTopRow[]
  topElo: BenchmarkTopRow[]
  topContext: BenchmarkTopRow[]
  topLatency: BenchmarkTopRow[]
  topTtfa: BenchmarkTopRow[]
  topThroughput: BenchmarkTopRow[]
  // Added 2026-05-22
  topSciCode: BenchmarkTopRow[]
  topIfBench: BenchmarkTopRow[]
  topAaLcr: BenchmarkTopRow[]
  topTerminalBench: BenchmarkTopRow[]
  topTau2: BenchmarkTopRow[]
  totalModels: number
  totalActiveLLMs: number
  lastSyncDate: string | null
}

export async function fetchRankingAAData(): Promise<RankingAAData> {
  // Fetch active models once
  const models = await fetchActiveModels()
  const llmTypes = new Set(['texto', 'text', 'llm'])
  const llmModels = models.filter((m) => llmTypes.has((m as ModelInfo & { tipo?: string }).empresa ? '' : ''))
  // Re-fetch with tipo to filter properly
  const modelsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_models?select=id,slug,nome,empresa,logo_url,tipo,velocidade_tokens_s,latencia_ttft,latencia_ttfa_s,preco_input_1m,context_window&status=eq.ativo&limit=1500`,
    fetchOptions,
  )
  const fullModels: Array<
    ModelInfo & {
      tipo: string
      velocidade_tokens_s: number | null
      latencia_ttft: number | null
      latencia_ttfa_s: number | null
      preco_input_1m: number | null
      context_window: number | null
    }
  > = modelsRes.ok ? await modelsRes.json() : []

  const llmList = fullModels.filter((m) => llmTypes.has(m.tipo))
  void llmModels // silence unused

  // Benchmark fetches in parallel
  const [
    intelligenceScores,
    codingScores,
    liveCodeScores,
    gpqaScores,
    hleScores,
    mmluProScores,
    aimeScores,
    math500Scores,
    mathIndexScores,
    eloScores,
    sciCodeScores,
    ifBenchScores,
    aaLcrScores,
    terminalBenchScores,
    tau2Scores,
  ] = await Promise.all([
    fetchBenchmarkScores('AA Intelligence Index', 600),
    fetchBenchmarkScores('AA Coding Index', 100),
    fetchBenchmarkScores('LiveCodeBench', 100),
    fetchBenchmarkScores('GPQA Diamond', 100),
    fetchBenchmarkScores('HLE', 100),
    fetchBenchmarkScores('MMLU-Pro', 100),
    fetchBenchmarkScores('AIME 2025', 100),
    fetchBenchmarkScores('MATH-500', 100),
    fetchBenchmarkScores('AA Math Index', 100),
    fetchBenchmarkScores('LMArena Elo', 100, false),
    fetchBenchmarkScores('SciCode', 100),
    fetchBenchmarkScores('IFBench', 100),
    fetchBenchmarkScores('AA-LCR', 100),
    fetchBenchmarkScores('Terminal-Bench Hard', 100),
    fetchBenchmarkScores('Tau²-Bench', 100),
  ])

  // Compute last sync date from intelligence benchmark
  let lastSyncDate: string | null = null
  try {
    const syncRes = await fetch(
      `${SUPABASE_URL}/rest/v1/ai_benchmarks?select=updated_at&benchmark_nome=eq.AA%20Intelligence%20Index&order=updated_at.desc&limit=1`,
      fetchOptions,
    )
    if (syncRes.ok) {
      const arr = await syncRes.json()
      lastSyncDate = arr[0]?.updated_at ?? null
    }
  } catch {
    /* noop */
  }

  // Top by performance metrics (from ai_models directly)
  const speedSorted = [...fullModels]
    .filter((m) => m.velocidade_tokens_s && m.velocidade_tokens_s > 0 && llmTypes.has(m.tipo))
    .sort((a, b) => (b.velocidade_tokens_s ?? 0) - (a.velocidade_tokens_s ?? 0))
    .slice(0, 25)

  const latencySorted = [...fullModels]
    .filter((m) => m.latencia_ttft && m.latencia_ttft > 0 && llmTypes.has(m.tipo))
    .sort((a, b) => (a.latencia_ttft ?? Infinity) - (b.latencia_ttft ?? Infinity))
    .slice(0, 25)

  const ttfaSorted = [...fullModels]
    .filter((m) => m.latencia_ttfa_s != null && m.latencia_ttfa_s > 0 && llmTypes.has(m.tipo))
    .sort((a, b) => (a.latencia_ttfa_s ?? Infinity) - (b.latencia_ttfa_s ?? Infinity))
    .slice(0, 25)

  const cheapestSorted = [...fullModels]
    .filter((m) => m.preco_input_1m !== null && m.preco_input_1m >= 0 && llmTypes.has(m.tipo))
    .sort((a, b) => (a.preco_input_1m ?? Infinity) - (b.preco_input_1m ?? Infinity))
    .slice(0, 25)

  const contextSorted = [...fullModels]
    .filter((m) => m.context_window && m.context_window > 0 && llmTypes.has(m.tipo))
    .sort((a, b) => (b.context_window ?? 0) - (a.context_window ?? 0))
    .slice(0, 20)

  return {
    topIntelligence: joinTop(intelligenceScores, fullModels, 12),
    topIntelligenceFull: joinTop(intelligenceScores, fullModels, 30),
    topCoding: joinTop(codingScores, fullModels, 25),
    topLiveCodeBench: joinTop(liveCodeScores, fullModels, 20),
    topGpqa: joinTop(gpqaScores, fullModels, 20),
    topHle: joinTop(hleScores, fullModels, 20),
    topMmluPro: joinTop(mmluProScores, fullModels, 20),
    topAime: joinTop(aimeScores, fullModels, 20),
    topMath500: joinTop(math500Scores, fullModels, 20),
    topMathIndex: joinTop(mathIndexScores, fullModels, 20),
    topElo: joinTop(eloScores, fullModels, 15),
    topSciCode: joinTop(sciCodeScores, fullModels, 20),
    topIfBench: joinTop(ifBenchScores, fullModels, 20),
    topAaLcr: joinTop(aaLcrScores, fullModels, 20),
    topTerminalBench: joinTop(terminalBenchScores, fullModels, 20),
    topTau2: joinTop(tau2Scores, fullModels, 20),
    topSpeed: speedSorted.map((m) => ({ slug: m.slug, nome: cleanName(m.nome), empresa: m.empresa, score: m.velocidade_tokens_s ?? 0 })),
    topLatency: latencySorted.map((m) => ({ slug: m.slug, nome: cleanName(m.nome), empresa: m.empresa, score: m.latencia_ttft ?? 0 })),
    topTtfa: ttfaSorted.map((m) => ({ slug: m.slug, nome: cleanName(m.nome), empresa: m.empresa, score: m.latencia_ttfa_s ?? 0 })),
    topCheapest: cheapestSorted.map((m) => ({ slug: m.slug, nome: cleanName(m.nome), empresa: m.empresa, score: m.preco_input_1m ?? 0 })),
    topContext: contextSorted.map((m) => ({ slug: m.slug, nome: cleanName(m.nome), empresa: m.empresa, score: m.context_window ?? 0 })),
    topThroughput: [], // placeholder — no field for total throughput yet
    totalModels: fullModels.length,
    totalActiveLLMs: llmList.length,
    lastSyncDate,
  }
}

// ─── video models leaderboard (from specs.nota) ────────────────────────────

export interface VideoModelRow {
  slug: string
  nome: string
  empresa: string
  nota: number
  duracao: string | null
  resolucao: string | null
}

export async function fetchTopVideoModels(): Promise<VideoModelRow[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_models?select=slug,nome,empresa,specs&status=eq.ativo&tipo=eq.video&limit=50`,
    fetchOptions,
  )
  if (!res.ok) return []
  const data: Array<{ slug: string; nome: string; empresa: string; specs: Record<string, unknown> | null }> = await res.json()
  return data
    .map((m) => {
      const specs = (m.specs ?? {}) as Record<string, unknown>
      const nota = typeof specs.nota === 'number' ? specs.nota : Number(specs.nota)
      if (!Number.isFinite(nota) || nota <= 0) return null
      return {
        slug: m.slug,
        nome: cleanName(m.nome),
        empresa: m.empresa,
        nota,
        duracao: (specs.duracao as string) ?? null,
        resolucao: (specs.resolucao as string) ?? null,
      } as VideoModelRow
    })
    .filter((r): r is VideoModelRow => r !== null)
    .sort((a, b) => b.nota - a.nota)
}

// ─── time series fetch (Intelligence over time) ────────────────────────────

export interface TimeSeriesPoint {
  date: string
  score: number
}

export interface TimeSeriesEntry {
  slug: string
  nome: string
  empresa: string
  points: TimeSeriesPoint[]
}

/**
 * Fetch historical snapshots for the top-N models on a given benchmark.
 * Returns a series per model with all daily points in the window.
 */
export async function fetchIntelligenceTimeSeries(opts: {
  benchmarkNome?: string
  topModelIds?: string[]
  windowDays?: number
  models?: ModelInfo[]
} = {}): Promise<TimeSeriesEntry[]> {
  const benchmarkNome = opts.benchmarkNome ?? 'AA Intelligence Index'
  const windowDays = opts.windowDays ?? 30
  const since = new Date(Date.now() - windowDays * 86400_000).toISOString().split('T')[0]

  // If topModelIds not given, derive from current top-10 of this benchmark
  let topIds = opts.topModelIds ?? []
  if (topIds.length === 0) {
    const currentRes = await fetch(
      `${SUPABASE_URL}/rest/v1/ai_benchmarks?select=model_id&benchmark_nome=eq.${encodeURIComponent(benchmarkNome)}&order=score.desc&limit=8`,
      fetchOptions,
    )
    if (currentRes.ok) {
      const data: { model_id: string }[] = await currentRes.json()
      topIds = data.map((r) => r.model_id)
    }
  }
  if (topIds.length === 0) return []

  // Models (for label/company); use provided list or fetch
  let models = opts.models
  if (!models) {
    const mRes = await fetch(
      `${SUPABASE_URL}/rest/v1/ai_models?select=id,slug,nome,empresa,logo_url&id=in.(${topIds.join(',')})`,
      fetchOptions,
    )
    models = mRes.ok ? await mRes.json() : []
  }
  const modelById = new Map((models ?? []).map((m) => [m.id, m]))

  // Fetch all snapshots for these model_ids in the window
  const idsParam = topIds.join(',')
  const snapRes = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_model_score_snapshots?select=model_id,score,snapshot_date&benchmark_nome=eq.${encodeURIComponent(benchmarkNome)}&snapshot_date=gte.${since}&model_id=in.(${idsParam})&order=snapshot_date.asc&limit=2000`,
    fetchOptions,
  )
  if (!snapRes.ok) return []
  const snapshots: { model_id: string; score: number; snapshot_date: string }[] = await snapRes.json()

  // Group by model
  const byModel = new Map<string, TimeSeriesPoint[]>()
  for (const s of snapshots) {
    const arr = byModel.get(s.model_id) ?? []
    arr.push({ date: s.snapshot_date, score: s.score })
    byModel.set(s.model_id, arr)
  }

  return topIds
    .map((id) => {
      const m = modelById.get(id)
      if (!m) return null
      return {
        slug: m.slug,
        nome: cleanName(m.nome),
        empresa: m.empresa,
        points: byModel.get(id) ?? [],
      } as TimeSeriesEntry
    })
    .filter((e): e is TimeSeriesEntry => e !== null)
}

// ─── helpers for the page ──────────────────────────────────────────────────

export function rowsFromBenchmarkTop(
  rows: BenchmarkTopRow[],
  opts: { formatter?: (n: number) => string; linkToBenchmark?: boolean } = {},
): import('@/components/ranking/RankingBarChart').BarRow[] {
  const fmt = opts.formatter ?? ((n) => n.toFixed(1))
  return rows.map((r) => ({
    label: r.nome,
    sublabel: r.empresa,
    value: r.score,
    displayValue: fmt(r.score),
    href: opts.linkToBenchmark === false ? undefined : `/benchmark/${r.slug}`,
  }))
}
