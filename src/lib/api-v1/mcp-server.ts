/**
 * Servidor MCP público (Fase 2, 17/07/2026) — expõe as MESMAS 4 fontes da API
 * REST v1 como "tools" pra agentes de IA (Claude, ChatGPT, Cursor). Zero
 * lógica de negócio própria: cada tool chama o fetcher/mapper JÁ existente da
 * API REST — se a regra de ranking mudar em fetch-aa.ts/fetchers.ts, os 3
 * consumidores (site, app, API REST, MCP) convergem juntos.
 *
 * Decisão 17/07: MCP não exige API key (maximiza adoção por agentes = maximiza
 * citação — a jogada GEO). Só rate limit por IP, mais generoso que o tier
 * anônimo da REST (conversas de agente chamam várias tools por turno).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  fetchNewsList,
  fetchNewsBySlug,
  fetchModelsList,
  fetchModelBySlug,
  fetchToolsList,
  fetchTutorialsList,
  fetchIntelligenceRanking,
} from './fetchers'
import { toNewsItem, toModelItem, toToolItem, toTutorialItem, toRankingItem } from './mappers'

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

// isError: true sinaliza erro no nível do protocolo MCP (não só um JSON com
// campo "error") — clientes que checam result.isError distinguem 404 de
// sucesso sem precisar fazer parsing heurístico do texto retornado.
function errorResult(message: string) {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: message }, null, 2) }], isError: true }
}

export function createMcpServer(): McpServer {
  const server = new McpServer({ name: 'swen-ai', version: '1.0.0' })

  server.registerTool(
    'search_news',
    {
      title: 'Search AI News',
      description: 'List recent AI news articles from SWEN.AI (Brazilian AI news portal). Returns summary + canonical link, never the full article body.',
      inputSchema: {
        limit: z.number().int().min(1).max(50).optional().describe('Max results (default 20)'),
        offset: z.number().int().min(0).optional().describe('Pagination offset (default 0)'),
        category: z.string().optional().describe('Filter by category, e.g. "Inteligência Artificial"'),
      },
    },
    async ({ limit, offset, category }) => {
      const rows = await fetchNewsList({ limit: limit ?? 20, offset: offset ?? 0, category })
      return textResult(rows.map(toNewsItem))
    },
  )

  server.registerTool(
    'get_news_article',
    {
      title: 'Get AI News Article',
      description: 'Get a single AI news article by slug.',
      inputSchema: { slug: z.string().min(1).describe('Article slug') },
    },
    async ({ slug }) => {
      const row = await fetchNewsBySlug(slug)
      if (!row) return errorResult(`No article found for slug "${slug}"`)
      return textResult(toNewsItem(row))
    },
  )

  server.registerTool(
    'list_ai_models',
    {
      title: 'List AI Models',
      description: 'List AI model catalog: pricing, context window, speed. From SWEN.AI benchmark database.',
      inputSchema: {
        limit: z.number().int().min(1).max(200).optional().describe('Max results (default 50)'),
        offset: z.number().int().min(0).optional().describe('Pagination offset (default 0)'),
      },
    },
    async ({ limit, offset }) => {
      const rows = await fetchModelsList({ limit: limit ?? 50, offset: offset ?? 0 })
      return textResult(rows.map(toModelItem))
    },
  )

  server.registerTool(
    'get_model',
    {
      title: 'Get AI Model',
      description: 'Get a single AI model by slug: pricing, context window, speed.',
      inputSchema: { slug: z.string().min(1).describe('Model slug') },
    },
    async ({ slug }) => {
      const row = await fetchModelBySlug(slug)
      if (!row) return errorResult(`No model found for slug "${slug}"`)
      return textResult(toModelItem(row))
    },
  )

  server.registerTool(
    'get_intelligence_ranking',
    {
      title: 'Get AI Intelligence Ranking',
      description:
        'The current AI model intelligence ranking (Artificial Analysis Intelligence Index), deduplicated by model family — one entry per model at its best configuration. Identical ordering to swen.ia.br/ranking and the SWEN.AI iOS app.',
      inputSchema: { limit: z.number().int().min(1).max(100).optional().describe('Max results (default 30)') },
    },
    async ({ limit }) => {
      const rows = await fetchIntelligenceRanking(limit ?? 30)
      return textResult({
        source: 'Artificial Analysis Intelligence Index',
        ranking: rows.map((r, i) => toRankingItem(r, i + 1)),
      })
    },
  )

  server.registerTool(
    'search_tools',
    {
      title: 'Search AI Tools',
      description: 'AI tools directory: pricing, ratings, categories. From SWEN.AI.',
      inputSchema: {
        limit: z.number().int().min(1).max(200).optional().describe('Max results (default 50)'),
        offset: z.number().int().min(0).optional().describe('Pagination offset (default 0)'),
      },
    },
    async ({ limit, offset }) => {
      const rows = await fetchToolsList({ limit: limit ?? 50, offset: offset ?? 0 })
      return textResult(rows.map(toToolItem))
    },
  )

  server.registerTool(
    'list_tutorials',
    {
      title: 'List AI Tutorials',
      description: 'Tutorials and guides directory. From SWEN.AI.',
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional().describe('Max results (default 30)'),
        offset: z.number().int().min(0).optional().describe('Pagination offset (default 0)'),
      },
    },
    async ({ limit, offset }) => {
      const rows = await fetchTutorialsList({ limit: limit ?? 30, offset: offset ?? 0 })
      return textResult(rows.map(toTutorialItem))
    },
  )

  return server
}
