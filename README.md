# AI Visibility Dashboard

Full-stack dashboard to track and analyze URL mentions across AI models (ChatGPT, Claude, Gemini, Perplexity). Upload CSV data, visualize trends, filter and export — all in real-time.

## Features

### Core
- **CSV Upload** — Drag & drop with server-side parsing, file validation, and real-time progress via WebSocket
- **Data Table** — Sortable columns, search by URL/title, filter by AI model/sentiment/domain, pagination (20/page)
- **Charts** — Bar chart (top 10 domains by count + avg visibility score), line chart (entries over time by `last_updated`)
- **Stats Cards** — Total URLs, unique domains, avg visibility score, most active AI model
- **CSV Export** — Download all entries as CSV with original column format

### Bonus
- **Real-time updates** — Socket.IO pushes upload progress and data refresh events
- **Data validation** — Zod schemas, CSV row validation, type coercion (parseInt/parseFloat/Date)
- **Unit tests** — 16 tests with Vitest covering domain extraction, row validation, CSV mapping
- **API key system** — Frictionless: auto-generated on first visit, recover from any device, logout/switch
- **MCP Server** — Claude Desktop & Claude Code integration with 4 tools (upload_csv, query_urls, get_stats, get_url_detail)
- **Shared package** — `@repo/shared` deduplicates logic across API, MCP, and frontend

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (Pages Router) + TypeScript + Tailwind CSS v4 + Recharts |
| Backend | Fastify + tRPC v10 + Zod |
| Database | PostgreSQL + Prisma ORM |
| Real-time | Socket.IO (room-based per API key) |
| CSV Parsing | papaparse (server-side) |
| MCP | @modelcontextprotocol/sdk |
| Monorepo | Turborepo + pnpm workspaces |
| Testing | Vitest |

## Architecture

```
apps/
  web/              → Next.js frontend (React + TypeScript + Tailwind)
  api/              → Fastify backend (tRPC + Socket.IO)
packages/
  database/         → Prisma ORM + PostgreSQL schema
  shared/           → Shared utilities (CSV parsing, validation, domain extraction)
  mcp/              → MCP server for Claude integration
  config-*/         → Shared ESLint & TypeScript configs
  docker-compose/   → Docker infrastructure
```

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL (via Docker, Homebrew, or Postgres.app)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL

**Option A — Docker:**
```bash
cd packages/docker-compose && docker-compose up -d
```

**Option B — Homebrew (macOS):**
```bash
brew install postgresql@17
brew services start postgresql@17
createuser -s repo
psql -U $(whoami) -d postgres -c "ALTER USER repo WITH PASSWORD 'repo';"
createdb -U repo repo_development
```

### 3. Configure environment

```bash
# Root .env (used by Prisma)
echo "DATABASE_URL=postgresql://repo:repo@localhost:5432/repo_development" > .env

# API .env
echo "DATABASE_URL=postgresql://repo:repo@localhost:5432/repo_development" > apps/api/.env
```

### 4. Set up database

```bash
pnpm run db:push
pnpm run generate
```

### 5. Build shared package

```bash
cd packages/shared && pnpm run build && cd ../..
```

### 6. Start dev servers

```bash
pnpm --filter web dev &
pnpm --filter @repo/api dev &
```

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **WebSocket**: ws://localhost:4000

## How It Works

### First Visit
1. Open http://localhost:3000
2. An API key is generated automatically and shown in the header
3. Upload a CSV file — data appears in real-time
4. **Save your API key** to access your data later

### Recovering Data
1. Click **Recover** in the header
2. Paste your API key
3. All your data loads instantly

### CSV Format

The CSV must have these 15 columns (snake_case headers):

```
url, title, ai_model_mentioned, citations_count, sentiment,
visibility_score, competitor_mentioned, query_category, last_updated,
traffic_estimate, domain_authority, mentions_count, position_in_response,
response_type, geographic_region
```

A sample file is provided at `domains.csv`.

## Database Schema

```prisma
model ApiKey {
  id        String     @id @default(cuid())
  key       String     @unique @default(uuid())
  label     String?
  createdAt DateTime   @default(now())
  entries   UrlEntry[]
}

model UrlEntry {
  id                  String   @id @default(cuid())
  url                 String
  domain              String
  title               String
  aiModelMentioned    String
  citationsCount      Int
  sentiment           String
  visibilityScore     Float
  competitorMentioned String
  queryCategory       String
  lastUpdated         DateTime
  trafficEstimate     Int
  domainAuthority     Int
  mentionsCount       Int
  positionInResponse  Int
  responseType        String
  geographicRegion    String
  createdAt           DateTime @default(now())
  apiKey              ApiKey   @relation(fields: [apiKeyId], references: [id])
  apiKeyId            String

  @@unique([apiKeyId, url])
  @@index([domain])
  @@index([lastUpdated])
  @@index([aiModelMentioned])
  @@index([apiKeyId])
}
```

Upserts on the compound key `(apiKeyId, url)` �� duplicate uploads update existing entries cleanly.

## API Endpoints

### tRPC Procedures (all scoped by API key via `x-api-key` header)

| Procedure | Type | Description |
|---|---|---|
| `apiKeys.generate` | mutation | Generate a new API key |
| `apiKeys.recover` | mutation | Validate an existing key and return entry count |
| `urls.upload` | mutation | Bulk upsert entries from parsed CSV |
| `urls.list` | query | Paginated list with search, filters, sorting |
| `urls.stats` | query | Aggregated stats (by domain, model, sentiment, date) |
| `urls.filters` | query | Available filter options (domains, models, sentiments) |

### REST

| Endpoint | Method | Description |
|---|---|---|
| `/api/upload` | POST | Multipart CSV file upload with real-time progress |

## MCP Server (Claude Integration)

The MCP server lets Claude upload CSVs and query your data directly.

### Setup for Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "promptwatch": {
      "command": "npx",
      "args": ["tsx", "packages/mcp/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://repo:repo@localhost:5432/repo_development"
      }
    }
  }
}
```

### Setup for Claude Code

```bash
claude mcp add promptwatch npx tsx packages/mcp/src/index.ts
```

### Available MCP Tools

| Tool | Description |
|---|---|
| `upload_csv` | Upload a CSV file by path |
| `query_urls` | Query entries with filters, sorting, pagination |
| `get_stats` | Get aggregated statistics |
| `get_url_detail` | Get full details for a specific URL |

All tools require an `apiKey` parameter — use the key from the dashboard.

## Tests

```bash
cd apps/api && pnpm test
```

16 tests covering:
- `extractDomain` — URL parsing, www stripping, subdomain handling
- `isValidRow` — Required fields, numeric validation
- `mapCsvRow` — Snake_case to camelCase, type coercion, date parsing

## Scripts

```bash
pnpm run dev              # Start all dev servers (requires Docker)
pnpm run build            # Build all packages
pnpm run db:push          # Push Prisma schema to database
pnpm run generate         # Generate Prisma client
pnpm --filter web dev     # Start frontend only
pnpm --filter @repo/api dev  # Start API only
```
