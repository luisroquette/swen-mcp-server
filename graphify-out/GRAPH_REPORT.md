# Graph Report - swen-mcp-server  (2026-08-14)

## Corpus Check
- Corpus is ~6,699 words - fits in a single context window. You may not need a graph.

## Summary
- 187 nodes · 263 edges · 10 communities (8 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f78dcb8f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MCP Tool Orchestration
- Product Documentation and CI
- Canonical URLs and Locale
- Ranking Data Freshness
- Package Dependencies
- TypeScript Compiler Configuration
- Product Site Interactions
- Site Validation
- Ranking Chart Types
- Fetch Type Extensions

## God Nodes (most connected - your core abstractions)
1. `createMcpServer()` - 16 edges
2. `compilerOptions` - 13 edges
3. `Hosted SWEN.AI MCP endpoint` - 11 edges
4. `buildCanonicalUrl()` - 9 edges
5. `Input validation, fetching, mapping, and JSON response wrappers` - 9 edges
6. `SWEN.AI MCP product site` - 9 edges
7. `restGet()` - 6 edges
8. `fetchIntelligenceRanking()` - 6 edges
9. `cleanName()` - 6 edges
10. `joinAndDedup()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Stable structured contracts instead of page scraping` --semantically_similar_to--> `Database rows mapped to stable public types`  [INFERRED] [semantically similar]
  index.html → README.md
- `Product site validation` --conceptually_related_to--> `SWEN.AI MCP product site`  [INFERRED]
  .github/workflows/ci.yml → index.html
- `Seven public MCP tools` --conceptually_related_to--> `Hosted SWEN.AI MCP endpoint`  [INFERRED]
  index.html → README.md
- `Public crawl policy and sitemap declaration` --references--> `SWEN.AI MCP product site`  [INFERRED]
  robots.txt → index.html
- `Free MIT-licensed reference implementation` --conceptually_related_to--> `Auditable reference source that may lag production`  [INFERRED]
  index.html → README.md

## Import Cycles
- 1-file cycle: `scripts/validate-site.mjs -> scripts/validate-site.mjs`
- 1-file cycle: `server.ts -> server.ts`
- 1-file cycle: `src/lib/api-v1/mcp-server.ts -> src/lib/api-v1/mcp-server.ts`

## Communities (10 total, 2 thin omitted)

### Community 0 - "MCP Tool Orchestration"
Cohesion: 0.10
Nodes (37): Modelcontextprotocol Sdk Server Mcp Js, Modelcontextprotocol Sdk Server Stdio Js, Zod, server, transport, fetchIntelligenceRanking(), fetchModelBySlug(), fetchModelsList() (+29 more)

### Community 1 - "Product Documentation and CI"
Cohesion: 0.08
Nodes (34): SWEN MCP continuous integration workflow, Product site validation, Node.js typecheck validation, Brazilian AI intelligence for agents, IP-based rate limiting, Free MIT-licensed reference implementation, No API key with explicit read-only limits, Portal, REST API, and MCP share one editorial source (+26 more)

### Community 2 - "Canonical URLs and Locale"
Cohesion: 0.09
Nodes (19): buildCanonicalUrlForLocale(), buildCategoryUrl(), buildNewsUrl(), CANONICAL_DOMAIN, CANONICAL_DOMAIN_BY_LOCALE, canonicalDomainForLocale(), EMAIL_CONTACT, EN_CANONICAL_DOMAIN (+11 more)

### Community 3 - "Ranking Data Freshness"
Cohesion: 0.13
Nodes (21): @/components/ranking/RankingBarChart, DatedScore, filterFreshScores(), STALE_BENCHMARK_DAYS, BenchmarkTopRow, cleanName(), familyKey(), fetchActiveModels() (+13 more)

### Community 4 - "Package Dependencies"
Cohesion: 0.09
Nodes (21): @modelcontextprotocol/sdk, dependencies, @modelcontextprotocol/sdk, zod, description, devDependencies, tsx, @types/node (+13 more)

### Community 5 - "TypeScript Compiler Configuration"
Cohesion: 0.11
Nodes (18): DOM, ES2020, node, src, compilerOptions, baseUrl, esModuleInterop, lib (+10 more)

### Community 6 - "Product Site Interactions"
Cohesion: 0.22
Nodes (6): consolePanel, consoleTabs, consoleViews, header, reveals, year

### Community 7 - "Site Validation"
Cohesion: 0.33
Nodes (5): Node Fs Promises, Node Path, ids, refs, root

## Knowledge Gaps
- **80 isolated node(s):** `name`, `version`, `private`, `description`, `license` (+75 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `buildCanonicalUrl()` connect `MCP Tool Orchestration` to `Canonical URLs and Locale`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `createMcpServer()` (e.g. with `toModelItem()` and `toNewsItem()`) actually correct?**
  _`createMcpServer()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _80 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MCP Tool Orchestration` be split into smaller, more focused modules?**
  _Cohesion score 0.10452961672473868 - nodes in this community are weakly interconnected._
- **Should `Product Documentation and CI` be split into smaller, more focused modules?**
  _Cohesion score 0.0766488413547237 - nodes in this community are weakly interconnected._
- **Should `Canonical URLs and Locale` be split into smaller, more focused modules?**
  _Cohesion score 0.09230769230769231 - nodes in this community are weakly interconnected._
- **Should `Ranking Data Freshness` be split into smaller, more focused modules?**
  _Cohesion score 0.12681159420289856 - nodes in this community are weakly interconnected._