import { z } from "zod";
import { router, authedProcedure } from "../trpc.js";
import { Prisma } from "@repo/database";
import {
  UrlEntrySchema,
  SORTABLE_FIELDS,
  extractDomain,
} from "@repo/shared";

export const urlsRouter = router({
  upload: authedProcedure
    .input(z.object({ entries: z.array(UrlEntrySchema) }))
    .mutation(async ({ ctx, input }) => {
      const apiKeyId = ctx.apiKeyRecord.id;
      let succeeded = 0;
      let failed = 0;

      for (const entry of input.entries) {
        try {
          const domain = extractDomain(entry.url);
          const lastUpdated = new Date(entry.lastUpdated);
          const data = {
            domain,
            title: entry.title,
            aiModelMentioned: entry.aiModelMentioned,
            citationsCount: entry.citationsCount,
            sentiment: entry.sentiment,
            visibilityScore: entry.visibilityScore,
            competitorMentioned: entry.competitorMentioned,
            queryCategory: entry.queryCategory,
            lastUpdated,
            trafficEstimate: entry.trafficEstimate,
            domainAuthority: entry.domainAuthority,
            mentionsCount: entry.mentionsCount,
            positionInResponse: entry.positionInResponse,
            responseType: entry.responseType,
            geographicRegion: entry.geographicRegion,
          };

          await ctx.prisma.urlEntry.upsert({
            where: { apiKeyId_url: { apiKeyId, url: entry.url } },
            create: { url: entry.url, apiKeyId, ...data },
            update: data,
          });
          succeeded++;
        } catch {
          failed++;
        }
      }

      return { succeeded, failed, total: input.entries.length };
    }),

  list: authedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        domain: z.string().optional(),
        aiModel: z.string().optional(),
        sentiment: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(SORTABLE_FIELDS).default("lastUpdated"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.UrlEntryWhereInput = {
        apiKeyId: ctx.apiKeyRecord.id,
      };

      if (input.domain) where.domain = input.domain;
      if (input.aiModel) where.aiModelMentioned = input.aiModel;
      if (input.sentiment) where.sentiment = input.sentiment;
      if (input.search) {
        where.OR = [
          { url: { contains: input.search, mode: "insensitive" } },
          { title: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [entries, total] = await Promise.all([
        ctx.prisma.urlEntry.findMany({
          where,
          orderBy: { [input.sortBy]: input.sortOrder },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.prisma.urlEntry.count({ where }),
      ]);

      return {
        entries,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  stats: authedProcedure.query(async ({ ctx }) => {
    const keyFilter = { apiKeyId: ctx.apiKeyRecord.id };

    const [totalUrls, uniqueDomains, avgVisibility, byDomainRaw, byModelRaw, bySentimentRaw, byDateRaw] =
      await Promise.all([
        ctx.prisma.urlEntry.count({ where: keyFilter }),
        ctx.prisma.urlEntry
          .findMany({ where: keyFilter, select: { domain: true }, distinct: ["domain"] })
          .then((r: { domain: string }[]) => r.length),
        ctx.prisma.urlEntry.aggregate({ where: keyFilter, _avg: { visibilityScore: true } }),
        ctx.prisma.urlEntry.groupBy({
          by: ["domain"],
          where: keyFilter,
          _count: { id: true },
          _avg: { visibilityScore: true },
          orderBy: { _count: { id: "desc" } },
          take: 10,
        }),
        ctx.prisma.urlEntry.groupBy({
          by: ["aiModelMentioned"],
          where: keyFilter,
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
        }),
        ctx.prisma.urlEntry.groupBy({
          by: ["sentiment"],
          where: keyFilter,
          _count: { id: true },
        }),
        ctx.prisma.urlEntry.findMany({
          where: keyFilter,
          select: { lastUpdated: true },
          orderBy: { lastUpdated: "asc" },
        }),
      ]);

    const dateMap = new Map<string, number>();
    for (const entry of byDateRaw) {
      const dateStr = entry.lastUpdated.toISOString().split("T")[0];
      dateMap.set(dateStr, (dateMap.get(dateStr) ?? 0) + 1);
    }

    const byDate = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const mostActiveModel = byModelRaw.length > 0 ? byModelRaw[0].aiModelMentioned : "N/A";

    return {
      totalUrls,
      uniqueDomains,
      avgVisibilityScore: avgVisibility._avg.visibilityScore ?? 0,
      mostActiveModel,
      byDomain: byDomainRaw.map((d) => ({
        domain: d.domain,
        count: d._count.id,
        avgScore: Math.round((d._avg.visibilityScore ?? 0) * 10) / 10,
      })),
      byDate,
      byModel: byModelRaw.map((m) => ({
        model: m.aiModelMentioned,
        count: m._count.id,
      })),
      bySentiment: bySentimentRaw.map((s) => ({
        sentiment: s.sentiment,
        count: s._count.id,
      })),
    };
  }),

  filters: authedProcedure.query(async ({ ctx }) => {
    const keyFilter = { apiKeyId: ctx.apiKeyRecord.id };

    const [domains, models, sentiments] = await Promise.all([
      ctx.prisma.urlEntry
        .findMany({ where: keyFilter, select: { domain: true }, distinct: ["domain"], orderBy: { domain: "asc" } })
        .then((r: { domain: string }[]) => r.map((d) => d.domain)),
      ctx.prisma.urlEntry
        .findMany({ where: keyFilter, select: { aiModelMentioned: true }, distinct: ["aiModelMentioned"], orderBy: { aiModelMentioned: "asc" } })
        .then((r: { aiModelMentioned: string }[]) => r.map((m) => m.aiModelMentioned)),
      ctx.prisma.urlEntry
        .findMany({ where: keyFilter, select: { sentiment: true }, distinct: ["sentiment"], orderBy: { sentiment: "asc" } })
        .then((r: { sentiment: string }[]) => r.map((s) => s.sentiment)),
    ]);

    return { domains, models, sentiments };
  }),
});
