# Runs the reference MCP server over stdio for registry introspection
# (e.g. Glama). Production traffic never touches this image — the real
# server runs on Vercel behind Streamable HTTP at https://swen.ia.br/api/mcp.
#
# The two env vars below are PUBLIC by design: NEXT_PUBLIC_* variables ship
# in every browser bundle on swen.ia.br already, and the Supabase key is the
# anon key, scoped by Postgres Row Level Security rather than by secrecy.
# See README.md "Security" for what is intentionally excluded from this repo.
FROM node:22-slim

WORKDIR /app
COPY package.json ./
RUN npm install

COPY . .

ENV NEXT_PUBLIC_SUPABASE_URL="https://isjsokhrfwzlafpuirvp.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzanNva2hyZnd6bGFmcHVpcnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDQ2NTUsImV4cCI6MjA5MjI4MDY1NX0.RL8b9Spa2K3Yh2OHFZRXyCacqnSBcBxMNcQHMDD0KnU"

ENTRYPOINT ["npx", "tsx", "server.ts"]
