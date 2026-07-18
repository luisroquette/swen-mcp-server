/**
 * Fetchers da API v1 — REST direto ao Supabase com a anon key (mesmo padrão
 * das rotas internas /api/benchmark, /api/ferramentas, /api/tutoriais: o
 * conteúdo já é público via RLS, a API key da SWEN serve pra identificar o
 * consumidor e aplicar rate limit, não pra portar dados privados).
 */

import { familyKey } from '@/lib/ranking/fetch-aa'
import { filterFreshScores } from '@/lib/benchmark/freshness'
import type { NoticiaRow, ModelRow, ToolRow, TutorialRow } from './mappers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const fetchOptions: RequestInit = {
  headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  next: { revalidate: 300, tags: ['api-v1'] },
}

async function restGet<T>(path: string, rangeHeader?: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...fetchOptions,
    headers: { ...fetchOptions.headers, ...(rangeHeader ? { Range: rangeHeader } : {}) },
  })
  if (!res.ok) return []
  return res.json()
}

const NEWS_FIELDS = 'slug,titulo,subtitulo,categoria,data_publicacao,updated_at,fonte,imagem_url'

export async function fetchNewsList(opts: { limit: number; offset: number; category?: string }): Promise<NoticiaRow[]> {
  const catFilter = opts.category ? `&categoria=eq.${encodeURIComponent(opts.category)}` : ''
  return restGet<NoticiaRow>(
    `noticias?select=${NEWS_FIELDS}&status=eq.published&idioma=eq.pt-BR${catFilter}&order=data_publicacao.desc`,
    `${opts.offset}-${opts.offset + opts.limit - 1}`,
  )
}

export async function fetchNewsBySlug(slug: string): Promise<NoticiaRow | null> {
  const rows = await restGet<NoticiaRow>(
    `noticias?select=${NEWS_FIELDS}&status=eq.published&idioma=eq.pt-BR&slug=eq.${encodeURIComponent(slug)}&limit=1`,
  )
  return rows[0] ?? null
}

const MODEL_FIELDS =
  'slug,nome,empresa,tipo,preco_input_1m,preco_output_1m,context_window,velocidade_tokens_s,latencia_ttft,open_source,logo_url'

export async function fetchModelsList(opts: { limit: number; offset: number }): Promise<ModelRow[]> {
  return restGet<ModelRow>(
    `ai_models?select=${MODEL_FIELDS}&status=eq.ativo&order=nome.asc`,
    `${opts.offset}-${opts.offset + opts.limit - 1}`,
  )
}

export async function fetchModelBySlug(slug: string): Promise<ModelRow | null> {
  const rows = await restGet<ModelRow>(
    `ai_models?select=${MODEL_FIELDS}&status=eq.ativo&slug=eq.${encodeURIComponent(slug)}&limit=1`,
  )
  return rows[0] ?? null
}

const TOOL_FIELDS =
  'slug,nome,descricao_curta,categoria,subcategoria,preco_tipo,preco_inicial,rating_medio,total_reviews,has_api,is_open_source,logo_url,url'

export async function fetchToolsList(opts: { limit: number; offset: number }): Promise<ToolRow[]> {
  return restGet<ToolRow>(
    `ai_tools?select=${TOOL_FIELDS}&status=eq.ativo&order=rating_medio.desc.nullslast,nome.asc`,
    `${opts.offset}-${opts.offset + opts.limit - 1}`,
  )
}

const TUTORIAL_FIELDS = 'slug,titulo,excerpt,categoria,difficulty,published_at,updated_at'

export async function fetchTutorialsList(opts: { limit: number; offset: number }): Promise<TutorialRow[]> {
  return restGet<TutorialRow>(
    `editorial_content?select=${TUTORIAL_FIELDS}&status=eq.publicado&idioma=eq.pt-BR&tipo=in.(tutorial,guia,video-post)&order=published_at.desc.nullslast`,
    `${opts.offset}-${opts.offset + opts.limit - 1}`,
  )
}

// ─── ranking (reusa a regra canônica — NUNCA reimplementar dedup/desempate) ──

interface RankingSourceRow {
  slug: string
  nome: string
  empresa: string
  score: number
}

/**
 * Ranking Score AA da API v1 — MESMA regra canônica do site/app (regra
 * 17/07/2026: "não há licença poética"). Reusa familyKey (dedup por família)
 * e a MESMA ordenação (score desc, nome asc) — nunca duplicar essa lógica
 * aqui; se a regra mudar, muda em fetch-aa.ts e os 3 consumidores (site, app,
 * API) convergem juntos pelos testes de paridade já existentes.
 */
export async function fetchIntelligenceRanking(limit: number): Promise<RankingSourceRow[]> {
  const [models, scores] = await Promise.all([
    restGet<{ id: string; slug: string; nome: string; empresa: string }>(
      'ai_models?select=id,slug,nome,empresa&status=eq.ativo&limit=1500',
    ),
    restGet<{ model_id: string; score: number; data_teste?: string | null }>(
      'ai_benchmarks?select=model_id,score,data_teste&benchmark_nome=eq.AA%20Intelligence%20Index&order=score.desc&limit=1000',
    ),
  ])
  const freshScores = filterFreshScores(scores)
  const modelById = new Map(models.map((m) => [m.id, m]))

  const joined = freshScores
    .map((s) => {
      const m = modelById.get(s.model_id)
      if (!m) return null
      return { slug: m.slug, nome: m.nome, empresa: m.empresa, score: s.score }
    })
    .filter((r): r is RankingSourceRow => r !== null)
    .sort((a, b) => b.score - a.score || a.nome.localeCompare(b.nome))

  const seen = new Set<string>()
  const deduped: RankingSourceRow[] = []
  for (const row of joined) {
    const k = familyKey(row.nome)
    if (seen.has(k)) continue
    seen.add(k)
    deduped.push(row)
  }
  return deduped.slice(0, limit)
}
