/**
 * Guarda de frescor para scores de benchmark sincronizados da Artificial Analysis.
 *
 * CONTEXTO DO BUG (16/jun/2026):
 * O modelo "Claude Opus 4.8" tinha DUAS linhas em ai_models:
 *   - anthropic-claude-opus-48   (slug malformado, sem traço) → score 61.4 congelado em 29/mai
 *   - anthropic-claude-opus-4-8  (slug canônico que a AA API usa) → score 55.7 atualizado diário
 * A AA recatalogou o Opus 4.8 com um slug ligeiramente diferente; nosso auto-import criou
 * uma linha nova e a antiga virou um ÓRFÃO permanente — o sync nunca mais a encontrava.
 * O ranking ordena puramente por score, então o órfão de 61.4 aparecia em #1 na frente do
 * Fable 5 (59.9), apesar de a fonte (AA) já marcar Fable como o melhor.
 *
 * DEFESA: um score só conta para ranking se sua data_teste estiver dentro de
 * STALE_BENCHMARK_DAYS do registro MAIS FRESCO daquele mesmo benchmark. Um órfão
 * congelado fica dias/semanas atrás dos irmãos sincronizados hoje → é descartado.
 * O limite é RELATIVO ao mais fresco (não ao relógio): se o sync inteiro cair por dias,
 * todas as linhas envelhecem juntas, o máximo acompanha, e nada é descartado por engano
 * (a queda total do sync é detectada separadamente por monitor-sync-health).
 */
export const STALE_BENCHMARK_DAYS = 10

export interface DatedScore {
  score: number
  data_teste?: string | null
}

/**
 * Remove linhas órfãs (stale) de uma lista de scores do MESMO benchmark.
 * Linhas sem data_teste passam (ex.: benchmarks manuais como LMArena Elo não são
 * gerenciados pelo sync da AA e não devem ser filtrados por esta guarda).
 */
export function filterFreshScores<T extends DatedScore>(rows: T[]): T[] {
  const datedMs = rows
    .map((r) => (r.data_teste ? new Date(r.data_teste).getTime() : NaN))
    .filter((ms) => Number.isFinite(ms))
  if (datedMs.length === 0) return rows // sem datas → não há como julgar frescor

  const maxMs = Math.max(...datedMs)
  const cutoffMs = maxMs - STALE_BENCHMARK_DAYS * 86_400_000

  return rows.filter((r) => {
    if (!r.data_teste) return true // mantém linhas sem data (benchmarks manuais)
    const ms = new Date(r.data_teste).getTime()
    if (!Number.isFinite(ms)) return true
    return ms >= cutoffMs
  })
}
