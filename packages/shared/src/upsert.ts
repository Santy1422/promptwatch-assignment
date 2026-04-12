import { extractDomain } from "./domain.js";
import type { CsvRow } from "./csv.js";

/** Build the Prisma data object for create/update from a raw CSV row. */
export function buildUpsertData(row: CsvRow) {
  const domain = extractDomain(row.url);
  return {
    domain,
    title: row.title,
    aiModelMentioned: row.ai_model_mentioned,
    citationsCount: parseInt(row.citations_count, 10),
    sentiment: row.sentiment,
    visibilityScore: parseFloat(row.visibility_score),
    competitorMentioned: row.competitor_mentioned,
    queryCategory: row.query_category,
    lastUpdated: new Date(row.last_updated),
    trafficEstimate: parseInt(row.traffic_estimate, 10),
    domainAuthority: parseInt(row.domain_authority, 10),
    mentionsCount: parseInt(row.mentions_count, 10),
    positionInResponse: parseInt(row.position_in_response, 10),
    responseType: row.response_type,
    geographicRegion: row.geographic_region,
  };
}

export interface BatchResult {
  succeeded: number;
  failed: number;
}

/**
 * Process rows in batches, calling the upsert function for each row.
 * Calls onProgress after each batch for realtime updates.
 */
export async function processBatches(
  rows: CsvRow[],
  upsertFn: (row: CsvRow, data: ReturnType<typeof buildUpsertData>) => Promise<unknown>,
  onProgress?: (result: BatchResult & { total: number; percent: number }) => void,
  batchSize = 25
): Promise<BatchResult> {
  let succeeded = 0;
  let failed = 0;
  const total = rows.length;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((row) => {
        const data = buildUpsertData(row);
        return upsertFn(row, data);
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") succeeded++;
      else failed++;
    }

    onProgress?.({
      succeeded,
      failed,
      total,
      percent: Math.round(((succeeded + failed) / total) * 100),
    });
  }

  return { succeeded, failed };
}
