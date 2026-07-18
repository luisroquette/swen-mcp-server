#!/usr/bin/env node
// Stdio entrypoint so this reference repo can be built/introspected by MCP
// registries (e.g. Glama). Production traffic never uses this file — it
// runs the same createMcpServer() over stdio instead of the hosted
// Streamable HTTP transport at https://swen.ia.br/api/mcp.
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createMcpServer } from './src/lib/api-v1/mcp-server.js'

const server = createMcpServer()
const transport = new StdioServerTransport()
await server.connect(transport)
