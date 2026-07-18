/**
 * Contrato ESTÁVEL da API pública v1 (swen.ia.br/api/v1). Campos em inglês,
 * nomenclatura própria — nunca o nome de coluna interno cru (regra 17/07/2026:
 * se renomearmos uma coluna do banco amanhã, terceiro não pode quebrar em
 * produção sem aviso; a tradução acontece nos mappers, não aqui).
 */

export interface NewsItem {
  slug: string
  title: string
  summary: string | null
  category: string | null
  publishedAt: string | null
  updatedAt: string | null
  source: string | null
  url: string // link canônico pro artigo em swen.ia.br — NUNCA o corpo completo no tier público
  imageUrl: string | null
}

export interface ModelItem {
  slug: string
  name: string
  vendor: string
  type: string | null
  inputPricePerMillionTokens: number | null
  outputPricePerMillionTokens: number | null
  contextWindow: number | null
  tokensPerSecond: number | null
  timeToFirstTokenMs: number | null
  isOpenSource: boolean
  logoUrl: string | null
  url: string
}

export interface RankingItem {
  rank: number
  slug: string
  name: string
  vendor: string
  score: number
  url: string
}

export interface ToolItem {
  slug: string
  name: string
  summary: string | null
  category: string | null
  subcategory: string | null
  pricingModel: string | null
  startingPriceUsd: number | null
  averageRating: number | null
  reviewCount: number | null
  hasApi: boolean
  isOpenSource: boolean
  logoUrl: string | null
  websiteUrl: string | null
  url: string
}

export interface TutorialItem {
  slug: string
  title: string
  summary: string | null
  category: string | null
  difficulty: string | null
  publishedAt: string | null
  updatedAt: string | null
  url: string
}

export interface ApiMeta {
  count: number
  source: string
  updatedAt: string | null
}

export interface ApiSuccess<T> {
  data: T
  meta?: ApiMeta
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}
