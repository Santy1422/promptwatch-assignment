import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { resolve } from "path";

const API_URL = process.env.API_URL || "http://localhost:4000";

// --- Types ---

interface TrpcResponse {
  result?: { data: Record<string, unknown> };
  error?: { message?: string };
}

interface UploadResponse {
  succeeded: number;
  failed: number;
  total: number;
  error?: string;
}

interface UrlEntry {
  url: string;
  domain: string;
  title: string;
  aiModelMentioned: string;
  visibilityScore: number;
  sentiment: string;
  citationsCount: number;
  positionInResponse: number;
  responseType: string;
  competitorMentioned: string;
  queryCategory: string;
  trafficEstimate: number;
  domainAuthority: number;
  mentionsCount: number;
  geographicRegion: string;
  lastUpdated: string;
}

interface ListResponse {
  entries: UrlEntry[];
  total: number;
  page: number;
  totalPages: number;
}

interface StatsResponse {
  totalUrls: number;
  uniqueDomains: number;
  avgVisibilityScore: number;
  mostActiveModel: string;
  byDomain: { domain: string; count: number; avgScore: number }[];
  byModel: { model: string; count: number }[];
  bySentiment: { sentiment: string; count: number }[];
  byDate: { date: string; count: number }[];
}

// --- HTTP helpers ---

async function trpcQuery<T>(path: string, input: unknown, apiKey: string): Promise<T> {
  const encoded = encodeURIComponent(JSON.stringify(input));
  const res = await fetch(`${API_URL}/trpc/${path}?input=${encoded}`, {
    headers: { "x-api-key": apiKey },
  });
  const json = (await res.json()) as TrpcResponse;
  if (!res.ok || json.error) throw new Error(json.error?.message || `tRPC error on ${path}`);
  return json.result!.data as T;
}

async function uploadFile(filePath: string, apiKey: string): Promise<UploadResponse> {
  const fileContent = readFileSync(resolve(filePath));
  const formData = new FormData();
  formData.append("file", new Blob([fileContent], { type: "text/csv" }), "upload.csv");

  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    headers: { "x-api-key": apiKey },
    body: formData,
  });
  const json = (await res.json()) as UploadResponse;
  if (!res.ok) throw new Error(json.error || "Upload failed");
  return json;
}

// --- Result helpers ---

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
  "Upload and import a CSV file via the API, scoped to your API key.",
  {
    apiKey: apiKeyParam,
    filePath: z.string().describe("Absolute path to the CSV file"),
  },
  async ({ apiKey, filePath }) => {
    try {
      const result = await uploadFile(filePath, apiKey);
      return textResult(
        [`CSV imported via API.`, `  Succeeded: ${result.succeeded}`, `  Failed: ${result.failed}`, `  Total: ${result.total}`].join("\n")
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
    sortBy: z.enum(["domain", "title", "aiModelMentioned", "visibilityScore", "citationsCount", "positionInResponse", "lastUpdated", "sentiment"]).optional().default("lastUpdated"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    page: z.number().optional().default(1),
    pageSize: z.number().optional().default(20),
  },
  async ({ apiKey, search, domain, aiModel, sentiment, sortBy, sortOrder, page, pageSize }) => {
    try {
      const data = await trpcQuery<ListResponse>("urls.list", {
        page,
        pageSize: Math.min(pageSize, 100),
        search: search || undefined,
        domain: domain || undefined,
        aiModel: aiModel || undefined,
        sentiment: sentiment || undefined,
        sortBy,
        sortOrder,
      }, apiKey);

      if (data.entries.length === 0) return textResult("No entries found.");

      const header = `Found ${data.total} entries (page ${data.page}/${data.totalPages}):\n`;
      const rows = data.entries
        .map(
          (e) =>
            `- [${e.domain}] "${e.title}" | ${e.aiModelMentioned} | Score: ${e.visibilityScore} | ${e.sentiment} | Citations: ${e.citationsCount} | Pos: ${e.positionInResponse} | ${e.lastUpdated.split("T")[0]}`
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
      const s = await trpcQuery<StatsResponse>("urls.stats", undefined, apiKey);

      if (s.totalUrls === 0) return textResult("No data yet. Use upload_csv first.");

      const lines = [
        "=== AI Visibility Stats ===", "",
        `Total URLs: ${s.totalUrls}`, `Unique Domains: ${s.uniqueDomains}`,
        `Avg Score: ${s.avgVisibilityScore.toFixed(1)}`, `Top Model: ${s.mostActiveModel}`, "",
        "--- Top 10 Domains ---",
        ...s.byDomain.map((d) => `  ${d.domain}: ${d.count} URLs (avg: ${d.avgScore})`),
        "", "--- By AI Model ---",
        ...s.byModel.map((m) => `  ${m.model}: ${m.count}`),
        "", "--- By Sentiment ---",
        ...s.bySentiment.map((x) => `  ${x.sentiment}: ${x.count}`),
        "", "--- Timeline ---",
        ...s.byDate.map((d) => `  ${d.date}: ${d.count}`),
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
      const data = await trpcQuery<ListResponse>("urls.list", {
        page: 1,
        pageSize: 1,
        search: url,
        sortBy: "lastUpdated",
        sortOrder: "desc",
      }, apiKey);

      if (data.entries.length === 0) return textResult(`No entry found matching "${url}".`);

      const e = data.entries[0];
      const lines = [
        `=== URL Detail ===`,
        `URL: ${e.url}`, `Domain: ${e.domain}`, `Title: ${e.title}`,
        `AI Model: ${e.aiModelMentioned}`, `Score: ${e.visibilityScore}`,
        `Sentiment: ${e.sentiment}`, `Citations: ${e.citationsCount}`,
        `Position: ${e.positionInResponse}`, `Type: ${e.responseType}`,
        `Competitor: ${e.competitorMentioned}`, `Category: ${e.queryCategory}`,
        `Traffic: ${e.trafficEstimate}`, `DA: ${e.domainAuthority}`,
        `Mentions: ${e.mentionsCount}`, `Region: ${e.geographicRegion}`,
        `Updated: ${e.lastUpdated.split("T")[0]}`,
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
  console.error(`Promptwatch MCP server running (API: ${API_URL})`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
