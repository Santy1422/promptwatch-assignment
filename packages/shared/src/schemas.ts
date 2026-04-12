import { z } from "zod";

/** Zod schema for a single URL entry (already mapped to camelCase). */
export const UrlEntrySchema = z.object({
  url: z.string().url(),
  title: z.string(),
  aiModelMentioned: z.string(),
  citationsCount: z.number().int(),
  sentiment: z.string(),
  visibilityScore: z.number(),
  competitorMentioned: z.string(),
  queryCategory: z.string(),
  lastUpdated: z.string().or(z.date()),
  trafficEstimate: z.number().int(),
  domainAuthority: z.number().int(),
  mentionsCount: z.number().int(),
  positionInResponse: z.number().int(),
  responseType: z.string(),
  geographicRegion: z.string(),
});

export type UrlEntryInput = z.infer<typeof UrlEntrySchema>;

/** Sort fields allowed for the list query. */
export const SORTABLE_FIELDS = [
  "domain",
  "title",
  "aiModelMentioned",
  "visibilityScore",
  "citationsCount",
  "positionInResponse",
  "lastUpdated",
  "sentiment",
] as const;

export type SortField = (typeof SORTABLE_FIELDS)[number];
