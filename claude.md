# CLAUDE.md — Technical Instructions

## Project Context
Promptwatch technical assignment. Building an AI Visibility Dashboard:
upload a CSV of URLs being mentioned by AI models (ChatGPT, Claude, Gemini, Perplexity),
store them in PostgreSQL, visualize in a professional analytics dashboard.

## Stack
- **Frontend**: Next.js (Pages Router) + TypeScript + Tailwind CSS + shadcn/ui + Recharts
- **Backend**: Fastify + tRPC + Zod validation
- **Database**: PostgreSQL + Prisma ORM
- **CSV Parsing**: papaparse (browser-side, send JSON to tRPC)
- **Monorepo**: Turborepo + pnpm workspaces

---

## Prisma Schema

Add to `packages/database/prisma/schema/main.prisma`:

```prisma
model UrlEntry {
  id                  String   @id @default(cuid())
  url                 String   @unique
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

  @@index([domain])
  @@index([lastUpdated])
  @@index([aiModelMentioned])
}
```

After adding run:
```bash
pnpm run db:push && pnpm run generate
```

---

## Dependencies to Install

```bash
cd apps/web
pnpm add papaparse recharts
pnpm add -D @types/papaparse
pnpm dlx shadcn-ui@latest init
pnpm dlx shadcn-ui@latest add table button badge card tabs input select toast
```

---

## tRPC Router

Create `apps/api/src/routers/urls.ts` with 3 procedures:

### `urls.upload` (mutation)
- Input: `{ entries: UrlEntrySchema[] }`
- For each entry: extract domain from URL (strip www.), upsert by `url` field
- Return: `{ succeeded, failed, total }`

### `urls.list` (query)
- Input: `{ page, pageSize, domain?, aiModel?, sentiment?, search?, sortBy, sortOrder }`
- Returns paginated entries + total count
- Search filters on `url` and `title` (case insensitive)

### `urls.stats` (query)
- No input
- Returns:
  - `byDomain`: top 10 domains by count + avg visibility score
  - `byDate`: entries grouped by `lastUpdated` date
  - `byModel`: count per AI model
  - `bySentiment`: count per sentiment value

Register in `apps/api/src/routers/index.ts`:
```typescript
import { urlsRouter } from './urls'
export const appRouter = router({ urls: urlsRouter })
```

---

## CSV Column Mapping (snake_case → camelCase + type coercion)

| CSV column | Field | Type |
|---|---|---|
| url | url | string |
| title | title | string |
| ai_model_mentioned | aiModelMentioned | string |
| citations_count | citationsCount | parseInt |
| sentiment | sentiment | string |
| visibility_score | visibilityScore | parseFloat |
| competitor_mentioned | competitorMentioned | string |
| query_category | queryCategory | string |
| last_updated | lastUpdated | new Date() |
| traffic_estimate | trafficEstimate | parseInt |
| domain_authority | domainAuthority | parseInt |
| mentions_count | mentionsCount | parseInt |
| position_in_response | positionInResponse | parseInt |
| response_type | responseType | string |
| geographic_region | geographicRegion | string |

---

## Frontend Components

### `components/CsvUpload.tsx`
- Drag & drop zone, accept only `.csv`, max 10MB
- Parse with papaparse in browser, map columns per table above, send to `urls.upload`
- States: idle → parsing → uploading → success / error
- Show result: "111 URLs imported successfully"

### `pages/index.tsx` — Dashboard layout

**Stats bar** (4 cards):
Total URLs | Unique domains | Avg visibility score | Most active AI model

**Charts row** (2 side by side):
- Left: BarChart — top 10 domains by URL count (tooltip shows avg visibility score)
- Right: LineChart — entries over time by `lastUpdated` date

**Data table**:
- Columns: Domain | Title | AI Model | Score | Sentiment | Citations | Position | Updated
- Sentiment as colored Badge: positive=green, neutral=yellow, negative=red
- Visibility score colored: >80 green, 60–80 yellow, <60 red
- Filters: search input + dropdowns for AI Model, Sentiment, Domain
- Sortable column headers
- Pagination (20 per page)

---

## Rules
- Always `upsert` on `url` field to handle duplicate uploads cleanly
- Always extract domain: `new URL(url).hostname.replace(/^www\./, '')`
- Always parseInt/parseFloat CSV number fields — they come as strings
- Convert `last_updated` with `new Date()` before saving
- No `any` types
- Keep router logic in `apps/api/src/routers/urls.ts`, not in index