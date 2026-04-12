import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { resolve } from "path";
import { prisma } from "@repo/database";
import { parseCsv, processBatches, SORTABLE_FIELDS } from "@repo/shared";

// --- Helpers ---

async function resolveApiKey(apiKey: string) {
  const record = await prisma.apiKey.findUnique({ where: { key: apiKey } });
  if (!record) return null;
  return record;
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

const apiKeyParam = z.string().describe("Your API key from the dashboard");

// --- MCP Server ---

const server = new McpServer({
  name: "promptwatch",
  version: "1.0.0",
});

// Tool 1: Upload CSV
server.tool(
  "upload_csv",
  "Upload and import a CSV file into the database, scoped to your API key.",
  {
    apiKey: apiKeyParam,
    filePath: z.string().describe("Absolute path to the CSV file"),
  },
  async ({ apiKey, filePath }) => {
    try {
      const keyRecord = await resolveApiKey(apiKey);
      if (!keyRecord) return errorResult("Invalid API key.");

      const csvString = readFileSync(resolve(filePath), "utf-8");
      const { validRows, errors, totalParsed } = parseCsv(csvString);

      if (errors.length > 0 && validRows.length === 0) {
        return errorResult(`CSV parsing failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
      }
      if (validRows.length === 0) {
        return errorResult("No valid entries found in CSV.");
      }

      const { succeeded, failed } = await processBatches(validRows, (row, data) =>
        prisma.urlEntry.upsert({
          where: { apiKeyId_url: { apiKeyId: keyRecord.id, url: row.url } },
          create: { url: row.url, apiKeyId: keyRecord.id, ...data },
          update: data,
        })
      );

      return textResult(
        [`CSV imported.`, `  Parsed: ${totalParsed}`, `  Valid: ${validRows.length}`, `  Succeeded: ${succeeded}`, `  Failed: ${failed}`].join("\n")
      );
    } catch (err) {
      return errorResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
);

// Tool 2: Query data
server.tool(
  "query_urls",
  "Query URL entries scoped to your API key, with filters, sorting, and pagination.",
  {
    apiKey: apiKeyParam,
    search: z.string().optional().describe("Search by URL or title"),
    domain: z.string().optional().describe("Filter by domain"),
    aiModel: z.string().optional().describe("Filter by AI model"),
    sentiment: z.string().optional().describe("Filter by sentiment"),
    sortBy: z.enum(SORTABLE_FIELDS).optional().default("lastUpdated"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    page: z.number().optional().default(1),
    pageSize: z.number().optional().default(20),
  },
  async ({ apiKey, search, domain, aiModel, sentiment, sortBy, sortOrder, page, pageSize }) => {
    try {
      const keyRecord = await resolveApiKey(apiKey);
      if (!keyRecord) return errorResult("Invalid API key.");

      const size = Math.min(pageSize, 100);
      const where: Record<string, unknown> = { apiKeyId: keyRecord.id };

      if (domain) where.domain = domain;
      if (aiModel) where.aiModelMentioned = aiModel;
      if (sentiment) where.sentiment = sentiment;
      if (search) {
        where.OR = [
          { url: { contains: search, mode: "insensitive" } },
          { title: { contains: search, mode: "insensitive" } },
        ];
      }

      const [entries, total] = await Promise.all([
        prisma.urlEntry.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * size, take: size }),
        prisma.urlEntry.count({ where }),
      ]);

      if (entries.length === 0) return textResult("No entries found.");

      const totalPages = Math.ceil(total / size);
      const header = `Found ${total} entries (page ${page}/${totalPages}):\n`;
      const rows = entries
        .map(
          (e: any) =>
            `- [${e.domain}] "${e.title}" | ${e.aiModelMentioned} | Score: ${e.visibilityScore} | ${e.sentiment} | Citations: ${e.citationsCount} | Pos: ${e.positionInResponse} | ${e.lastUpdated.toISOString().split("T")[0]}`
        )
        .join("\n");

      return textResult(header + rows);
    } catch (err) {
      return errorResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
);

// Tool 3: Get stats
server.tool(
  "get_stats",
  "Get aggregated statistics for your API key's data.",
  { apiKey: apiKeyParam },
  async ({ apiKey }) => {
    try {
      const keyRecord = await resolveApiKey(apiKey);
      if (!keyRecord) return errorResult("Invalid API key.");

      const kf = { apiKeyId: keyRecord.id };

      const [totalUrls, uniqueDomains, avgVisibility, byDomainRaw, byModelRaw, bySentimentRaw, byDateRaw] =
        await Promise.all([
          prisma.urlEntry.count({ where: kf }),
          prisma.urlEntry.findMany({ where: kf, select: { domain: true }, distinct: ["domain"] }).then((r: any[]) => r.length),
          prisma.urlEntry.aggregate({ where: kf, _avg: { visibilityScore: true } }),
          prisma.urlEntry.groupBy({ by: ["domain"], where: kf, _count: { id: true }, _avg: { visibilityScore: true }, orderBy: { _count: { id: "desc" } }, take: 10 }),
          prisma.urlEntry.groupBy({ by: ["aiModelMentioned"], where: kf, _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
          prisma.urlEntry.groupBy({ by: ["sentiment"], where: kf, _count: { id: true } }),
          prisma.urlEntry.findMany({ where: kf, select: { lastUpdated: true }, orderBy: { lastUpdated: "asc" } }),
        ]);

      if (totalUrls === 0) return textResult("No data yet. Use upload_csv first.");

      const dateMap = new Map<string, number>();
      for (const e of byDateRaw) {
        const d = e.lastUpdated.toISOString().split("T")[0];
        dateMap.set(d, (dateMap.get(d) ?? 0) + 1);
      }

      const avg = (avgVisibility as any)._avg.visibilityScore ?? 0;
      const top = byModelRaw.length > 0 ? (byModelRaw[0] as any).aiModelMentioned : "N/A";

      const lines = [
        "=== AI Visibility Stats ===", "",
        `Total URLs: ${totalUrls}`, `Unique Domains: ${uniqueDomains}`,
        `Avg Score: ${avg.toFixed(1)}`, `Top Model: ${top}`, "",
        "--- Top 10 Domains ---",
        ...byDomainRaw.map((d: any) => `  ${d.domain}: ${d._count.id} URLs (avg: ${(d._avg.visibilityScore ?? 0).toFixed(1)})`),
        "", "--- By AI Model ---",
        ...byModelRaw.map((m: any) => `  ${m.aiModelMentioned}: ${m._count.id}`),
        "", "--- By Sentiment ---",
        ...bySentimentRaw.map((s: any) => `  ${s.sentiment}: ${s._count.id}`),
        "", "--- Timeline ---",
        ...Array.from(dateMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => `  ${date}: ${count}`),
      ];

      return textResult(lines.join("\n"));
    } catch (err) {
      return errorResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
);

// Tool 4: URL detail
server.tool(
  "get_url_detail",
  "Get full details for a URL entry, scoped to your API key.",
  {
    apiKey: apiKeyParam,
    url: z.string().describe("Full or partial URL to search for"),
  },
  async ({ apiKey, url }) => {
    try {
      const keyRecord = await resolveApiKey(apiKey);
      if (!keyRecord) return errorResult("Invalid API key.");

      const entry = await prisma.urlEntry.findFirst({
        where: {
          apiKeyId: keyRecord.id,
          OR: [
            { url: { contains: url, mode: "insensitive" } },
            { domain: { contains: url, mode: "insensitive" } },
          ],
        },
      });

      if (!entry) return textResult(`No entry found matching "${url}".`);

      const lines = [
        `=== URL Detail ===`,
        `URL: ${entry.url}`, `Domain: ${entry.domain}`, `Title: ${entry.title}`,
        `AI Model: ${entry.aiModelMentioned}`, `Score: ${entry.visibilityScore}`,
        `Sentiment: ${entry.sentiment}`, `Citations: ${entry.citationsCount}`,
        `Position: ${entry.positionInResponse}`, `Type: ${entry.responseType}`,
        `Competitor: ${entry.competitorMentioned}`, `Category: ${entry.queryCategory}`,
        `Traffic: ${entry.trafficEstimate.toLocaleString()}`, `DA: ${entry.domainAuthority}`,
        `Mentions: ${entry.mentionsCount}`, `Region: ${entry.geographicRegion}`,
        `Updated: ${entry.lastUpdated.toISOString().split("T")[0]}`,
      ];

      return textResult(lines.join("\n"));
    } catch (err) {
      return errorResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
);

// --- Start ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Promptwatch MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
