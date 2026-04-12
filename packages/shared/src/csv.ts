import Papa from "papaparse";

/** Raw CSV row with snake_case column names (all strings). */
export interface CsvRow {
  url: string;
  title: string;
  ai_model_mentioned: string;
  citations_count: string;
  sentiment: string;
  visibility_score: string;
  competitor_mentioned: string;
  query_category: string;
  last_updated: string;
  traffic_estimate: string;
  domain_authority: string;
  mentions_count: string;
  position_in_response: string;
  response_type: string;
  geographic_region: string;
}

/** Mapped entry with camelCase fields and correct types. */
export interface MappedEntry {
  url: string;
  title: string;
  aiModelMentioned: string;
  citationsCount: number;
  sentiment: string;
  visibilityScore: number;
  competitorMentioned: string;
  queryCategory: string;
  lastUpdated: Date;
  trafficEstimate: number;
  domainAuthority: number;
  mentionsCount: number;
  positionInResponse: number;
  responseType: string;
  geographicRegion: string;
}

/** Validate that a CSV row has the minimum required fields. */
export function isValidRow(row: CsvRow): boolean {
  return (
    typeof row.url === "string" &&
    row.url.length > 0 &&
    typeof row.title === "string" &&
    !isNaN(parseInt(row.citations_count, 10)) &&
    !isNaN(parseFloat(row.visibility_score))
  );
}

/** Map a raw CSV row (snake_case strings) to a typed entry (camelCase, coerced). */
export function mapCsvRow(row: CsvRow): MappedEntry {
  return {
    url: row.url,
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

export interface ParseResult {
  validRows: CsvRow[];
  errors: string[];
  totalParsed: number;
}

/** Parse a CSV string, validate rows, and return valid rows + errors. */
export function parseCsv(csvString: string): ParseResult {
  const parsed = Papa.parse<CsvRow>(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  const errors = parsed.errors.slice(0, 5).map((e) => e.message);
  const validRows = parsed.data.filter(isValidRow);

  return {
    validRows,
    errors,
    totalParsed: parsed.data.length,
  };
}
