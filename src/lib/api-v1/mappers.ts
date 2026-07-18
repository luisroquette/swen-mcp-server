/**
 * Mappers puros: linha crua do Supabase → contrato estável da API v1.
 * Zero I/O aqui de propósito — são testados com fixtures, sem rede
 * (src/__tests__/api-v1-contract.regression.test.ts trava o shape exato).
 */

import { buildCanonicalUrl } from '@/lib/canonicalDomain'
import type { NewsItem, ModelItem, RankingItem, ToolItem, TutorialItem } from './types'

/** Strip vendor prefix ("OpenAI: GPT-5" → "GPT-5") — mesma regra do ranking. */
function cleanName(nome: string): string {
  return nome.replace(/^[^:]+:\s*/, '')
}

export interface NoticiaRow {
  slug: string
  titulo: string
  subtitulo: string | null
  categoria: string | null
  data_publicacao: string | null
  updated_at: string | null
  fonte: string | null
  imagem_url: string | null
}

// Regra 17/07: tier público NUNCA recebe o corpo completo do artigo — só
// resumo + link canônico. Protege o tráfego do portal (o clique é o produto).
export function toNewsItem(row: NoticiaRow): NewsItem {
  return {
    slug: row.slug,
    title: row.titulo,
    summary: row.subtitulo,
    category: row.categoria,
    publishedAt: row.data_publicacao,
    updatedAt: row.updated_at,
    source: row.fonte,
    url: buildCanonicalUrl(`/noticia/${row.slug}`),
    imageUrl: row.imagem_url,
  }
}

export interface ModelRow {
  slug: string
  nome: string
  empresa: string
  tipo: string | null
  preco_input_1m: number | null
  preco_output_1m: number | null
  context_window: number | null
  velocidade_tokens_s: number | null
  latencia_ttft: number | null
  open_source: boolean | null
  logo_url: string | null
}

export function toModelItem(row: ModelRow): ModelItem {
  return {
    slug: row.slug,
    name: cleanName(row.nome),
    vendor: row.empresa,
    type: row.tipo,
    inputPricePerMillionTokens: row.preco_input_1m,
    outputPricePerMillionTokens: row.preco_output_1m,
    contextWindow: row.context_window,
    tokensPerSecond: row.velocidade_tokens_s,
    timeToFirstTokenMs: row.latencia_ttft,
    isOpenSource: row.open_source ?? false,
    logoUrl: row.logo_url,
    url: buildCanonicalUrl(`/benchmark/${row.slug}`),
  }
}

/** rank é atribuído pelo caller (posição na lista já ordenada/deduplicada). */
export function toRankingItem(row: { slug: string; nome: string; empresa: string; score: number }, rank: number): RankingItem {
  return {
    rank,
    slug: row.slug,
    name: cleanName(row.nome),
    vendor: row.empresa,
    score: row.score,
    url: buildCanonicalUrl(`/benchmark/${row.slug}`),
  }
}

export interface ToolRow {
  slug: string
  nome: string
  descricao_curta: string | null
  categoria: string | null
  subcategoria: string | null
  preco_tipo: string | null
  preco_inicial: number | null
  rating_medio: number | null
  total_reviews: number | null
  has_api: boolean | null
  is_open_source: boolean | null
  logo_url: string | null
  url: string | null
}

export function toToolItem(row: ToolRow): ToolItem {
  return {
    slug: row.slug,
    name: row.nome,
    summary: row.descricao_curta,
    category: row.categoria,
    subcategory: row.subcategoria,
    pricingModel: row.preco_tipo,
    startingPriceUsd: row.preco_inicial,
    averageRating: row.rating_medio,
    reviewCount: row.total_reviews,
    hasApi: row.has_api ?? false,
    isOpenSource: row.is_open_source ?? false,
    logoUrl: row.logo_url,
    websiteUrl: row.url,
    url: buildCanonicalUrl(`/ferramentas/${row.slug}`),
  }
}

export interface TutorialRow {
  slug: string
  titulo: string
  excerpt: string | null
  categoria: string | null
  difficulty: string | null
  published_at: string | null
  updated_at: string | null
}

export function toTutorialItem(row: TutorialRow): TutorialItem {
  return {
    slug: row.slug,
    title: row.titulo,
    summary: row.excerpt,
    category: row.categoria,
    difficulty: row.difficulty,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    url: buildCanonicalUrl(`/tutorial/${row.slug}`),
  }
}
