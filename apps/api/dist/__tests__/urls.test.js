import { describe, it, expect } from "vitest";
import { extractDomain } from "@repo/shared";
import { isValidRow, mapCsvRow } from "@repo/shared";
describe("extractDomain", () => {
    it("extracts domain from a standard URL", () => {
        expect(extractDomain("https://www.hubspot.com/marketing")).toBe("hubspot.com");
    });
    it("strips www. prefix", () => {
        expect(extractDomain("https://www.salesforce.com/products")).toBe("salesforce.com");
    });
    it("preserves subdomains other than www", () => {
        expect(extractDomain("https://blog.example.com/post")).toBe("blog.example.com");
    });
    it("handles URLs with query parameters", () => {
        expect(extractDomain("https://www.shopify.com/pricing?ref=perplexity")).toBe("shopify.com");
    });
    it("returns original string for invalid URLs", () => {
        expect(extractDomain("not-a-url")).toBe("not-a-url");
    });
    it("handles URLs without www", () => {
        expect(extractDomain("https://notion.so/product")).toBe("notion.so");
    });
});
describe("isValidRow", () => {
    const validRow = {
        url: "https://example.com",
        title: "Test",
        ai_model_mentioned: "ChatGPT",
        citations_count: "42",
        sentiment: "positive",
        visibility_score: "85.5",
        competitor_mentioned: "Competitor",
        query_category: "test",
        last_updated: "2024-12-15",
        traffic_estimate: "1000",
        domain_authority: "90",
        mentions_count: "50",
        position_in_response: "1",
        response_type: "recommendation_list",
        geographic_region: "global",
    };
    it("validates a correct row", () => {
        expect(isValidRow(validRow)).toBe(true);
    });
    it("rejects row with empty URL", () => {
        expect(isValidRow({ ...validRow, url: "" })).toBe(false);
    });
    it("rejects row with non-numeric citations_count", () => {
        expect(isValidRow({ ...validRow, citations_count: "abc" })).toBe(false);
    });
    it("rejects row with non-numeric visibility_score", () => {
        expect(isValidRow({ ...validRow, visibility_score: "not_a_number" })).toBe(false);
    });
    it("accepts row with zero values", () => {
        expect(isValidRow({ ...validRow, citations_count: "0", visibility_score: "0" })).toBe(true);
    });
});
describe("mapCsvRow", () => {
    const row = {
        url: "https://www.hubspot.com/marketing?utm_source=ai",
        title: "Best Marketing Software",
        ai_model_mentioned: "ChatGPT",
        citations_count: "247",
        sentiment: "positive",
        visibility_score: "85.5",
        competitor_mentioned: "Salesforce",
        query_category: "marketing_tools",
        last_updated: "2024-12-15",
        traffic_estimate: "850000",
        domain_authority: "92",
        mentions_count: "156",
        position_in_response: "1",
        response_type: "recommendation_list",
        geographic_region: "global",
    };
    it("maps snake_case to camelCase", () => {
        const mapped = mapCsvRow(row);
        expect(mapped.aiModelMentioned).toBe("ChatGPT");
        expect(mapped.citationsCount).toBe(247);
        expect(mapped.competitorMentioned).toBe("Salesforce");
        expect(mapped.queryCategory).toBe("marketing_tools");
        expect(mapped.geographicRegion).toBe("global");
    });
    it("converts numeric strings to numbers", () => {
        const mapped = mapCsvRow(row);
        expect(typeof mapped.citationsCount).toBe("number");
        expect(typeof mapped.visibilityScore).toBe("number");
        expect(typeof mapped.trafficEstimate).toBe("number");
        expect(typeof mapped.domainAuthority).toBe("number");
        expect(typeof mapped.mentionsCount).toBe("number");
        expect(typeof mapped.positionInResponse).toBe("number");
    });
    it("parses visibility_score as float", () => {
        const mapped = mapCsvRow(row);
        expect(mapped.visibilityScore).toBe(85.5);
    });
    it("converts last_updated to Date object", () => {
        const mapped = mapCsvRow(row);
        expect(mapped.lastUpdated).toBeInstanceOf(Date);
        expect(mapped.lastUpdated.toISOString().startsWith("2024-12-15")).toBe(true);
    });
    it("preserves string fields as-is", () => {
        const mapped = mapCsvRow(row);
        expect(mapped.url).toBe(row.url);
        expect(mapped.title).toBe(row.title);
        expect(mapped.sentiment).toBe("positive");
        expect(mapped.responseType).toBe("recommendation_list");
    });
});
//# sourceMappingURL=urls.test.js.map