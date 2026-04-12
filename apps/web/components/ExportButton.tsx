import { trpc } from "../utils/trpc";
import { useToast } from "./ui/toast";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 100;

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const utils = trpc.useUtils();
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Paginate through all entries respecting API limit
      const allEntries: Awaited<ReturnType<typeof utils.urls.list.fetch>>["entries"] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const data = await utils.urls.list.fetch({
          page,
          pageSize: PAGE_SIZE,
          sortBy: "lastUpdated",
          sortOrder: "desc",
        });
        allEntries.push(...data.entries);
        hasMore = page < data.totalPages;
        page++;
      }

      if (allEntries.length === 0) {
        toast({ title: "Nothing to export", description: "No entries found", variant: "destructive" });
        return;
      }

      const headers = [
        "url", "title", "ai_model_mentioned", "citations_count", "sentiment",
        "visibility_score", "competitor_mentioned", "query_category", "last_updated",
        "traffic_estimate", "domain_authority", "mentions_count", "position_in_response",
        "response_type", "geographic_region",
      ];

      const rows = allEntries.map((e) => [
        e.url, e.title, e.aiModelMentioned, e.citationsCount, e.sentiment,
        e.visibilityScore, e.competitorMentioned, e.queryCategory,
        new Date(e.lastUpdated).toISOString().split("T")[0],
        e.trafficEstimate, e.domainAuthority, e.mentionsCount,
        e.positionInResponse, e.responseType, e.geographicRegion,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((val) => {
              const str = String(val);
              return str.includes(",") || str.includes('"')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai-visibility-export-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: `Exported ${allEntries.length} entries`,
        variant: "success",
      });
    } catch {
      toast({ title: "Export failed", description: "Could not export data", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
