# SWEN.AI MCP Server (reference source)

This repository contains the **reference implementation** of the source code
behind the public [Model Context Protocol](https://modelcontextprotocol.io)
(MCP) server hosted at:

```
https://swen.ia.br/api/mcp
```

[SWEN.AI](https://swen.ia.br) is a Brazilian portal covering AI news, model
benchmarks, tools and tutorials. This MCP server exposes that data to AI
agents and MCP-compatible clients (Claude, Claude Code, etc.) with **no API
key required** (IP-based rate limiting only).

## This is not a runnable standalone package

The files here are copied verbatim from our private production monorepo so
that developers can **read, audit, and understand** exactly what the hosted
endpoint does. Authentication, rate-limiting, and infrastructure code are
intentionally **not included** — see [Security](#security) below.

To use the server, connect your MCP client directly to the hosted endpoint;
there is nothing to install or run locally.

### Connecting an MCP client

```json
{
  "mcpServers": {
    "swen-ai": {
      "url": "https://swen.ia.br/api/mcp"
    }
  }
}
```

## Available tools

| Tool | Description |
|---|---|
| `search_news` | Search/list published AI news articles |
| `get_news_article` | Fetch a single news article by slug |
| `list_ai_models` | List tracked AI models |
| `get_model` | Fetch a single AI model by slug |
| `get_intelligence_ranking` | Get the canonical Artificial Analysis Intelligence Index ranking |
| `search_tools` | Search/list AI tools in the directory |
| `list_tutorials` | List tutorials |

Every tool is a thin wrapper: it validates input, calls a `fetchers.ts`
function to read from Postgres (via Supabase's REST API using the public
anon key), maps the row to a stable public contract (`mappers.ts` /
`types.ts`), and returns JSON.

## Files in this repo

```
src/lib/api-v1/
  mcp-server.ts     tool registration (the 7 tools above)
  fetchers.ts       data-fetching functions (reads only, public anon key)
  mappers.ts        DB row → public contract mapping
  types.ts          public contract types (NewsItem, ModelItem, ...)
src/lib/ranking/
  fetch-aa.ts       canonical Artificial Analysis ranking logic (dedup + sort)
src/lib/benchmark/
  freshness.ts      filters out stale benchmark scores
src/lib/i18n/
  config.ts         locale constants used by the mappers
```

These are copied byte-for-byte from the production repo. They are kept in
sync manually; they may lag the deployed version slightly.

## Also see

- REST API docs (API key required, higher rate limits): https://swen.ia.br/developers
- Full portal: https://swen.ia.br

## Security

This repo deliberately **excludes**:
- `auth.ts` — API key validation and rate-limiting logic
- `key-crypto.ts` — API key hashing
- Any environment variable, credential, or internal Supabase project
  reference beyond the two values that are public by design:
  `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (already
  shipped in every page's browser bundle on swen.ia.br; access is governed
  by Postgres Row Level Security, not by keeping this value secret).

If you believe you've found a security issue with the hosted endpoint,
please report it privately rather than opening a public issue.

## License

MIT — see [LICENSE](LICENSE).
