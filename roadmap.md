# ROADMAP.md — Build Plan

## Phase 1 — Setup (30 min)
- [ ] Clone repo, `pnpm install`
- [ ] `cd packages/docker-compose && docker-compose up -d`
- [ ] Create `.env` files with `DATABASE_URL=postgresql://repo:repo@localhost:5432/repo_development`
- [ ] Add Prisma schema (`UrlEntry` model)
- [ ] `pnpm run db:push && pnpm run generate`
- [ ] Install frontend deps: papaparse, recharts, shadcn/ui

## Phase 2 — Backend (1 hr)
- [ ] Create `apps/api/src/routers/urls.ts`
  - [ ] `urls.upload` mutation (upsert with domain extraction)
  - [ ] `urls.list` query (pagination + filters + sorting)
  - [ ] `urls.stats` query (byDomain, byDate, byModel, bySentiment)
- [ ] Register router in `apps/api/src/routers/index.ts`
- [ ] Test endpoints with a quick curl or Postman

## Phase 3 — CSV Upload Component (45 min)
- [ ] `components/CsvUpload.tsx` with drag & drop
- [ ] papaparse integration + column mapping (snake_case → camelCase, type coercion)
- [ ] Upload states: idle → parsing → uploading → success/error
- [ ] Toast notification with result count

## Phase 4 — Dashboard (1.5 hrs)
- [ ] Stats bar: 4 summary cards
- [ ] BarChart: top 10 domains by URL count
- [ ] LineChart: entries over time by `last_updated`
- [ ] Data table with all columns
- [ ] Filters: search + AI Model + Sentiment + Domain dropdowns
- [ ] Sortable headers
- [ ] Pagination

## Phase 5 — Polish (45 min)
- [ ] Skeleton loaders on all data sections
- [ ] Empty state when no data uploaded yet (with CTA to upload)
- [ ] Error boundaries
- [ ] Mobile-responsive layout
- [ ] Export to CSV button (bonus)

---

## Time Estimate
| Phase | Time |
|---|---|
| Setup | 30 min |
| Backend | 1 hr |
| CSV Upload | 45 min |
| Dashboard | 1.5 hrs |
| Polish | 45 min |
| **Total** | **~4.5 hrs** |

---

## Key Decisions
- **papaparse in browser** — avoids multipart complexity in Fastify, cleaner UX
- **upsert on url** — safe to re-upload same CSV, no duplicates
- **domain extracted from URL** — normalized, strips www., not taken raw from CSV
- **shadcn/ui + Tailwind** — production-grade UI with minimal effort
- **3 tRPC procedures** — clean separation: upload / list / stats