import { useState } from "react";
import { trpc } from "../utils/trpc";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Skeleton } from "./ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  SearchX,
} from "lucide-react";

type SortField =
  | "domain"
  | "title"
  | "aiModelMentioned"
  | "visibilityScore"
  | "citationsCount"
  | "positionInResponse"
  | "lastUpdated"
  | "sentiment";

function getSentimentVariant(sentiment: string) {
  switch (sentiment.toLowerCase()) {
    case "positive":
      return "positive" as const;
    case "negative":
      return "negative" as const;
    default:
      return "neutral" as const;
  }
}

function getScoreColor(score: number) {
  if (score > 80) return "text-emerald-600 font-semibold";
  if (score >= 60) return "text-yellow-600 font-semibold";
  return "text-red-600 font-semibold";
}

function SortIcon({
  field,
  currentSort,
  currentOrder,
}: {
  field: SortField;
  currentSort: SortField;
  currentOrder: "asc" | "desc";
}) {
  if (field !== currentSort)
    return <ArrowUpDown className="ml-1 inline h-3 w-3 text-muted-foreground/50" />;
  return currentOrder === "asc" ? (
    <ArrowUp className="ml-1 inline h-3 w-3 text-primary" />
  ) : (
    <ArrowDown className="ml-1 inline h-3 w-3 text-primary" />
  );
}

export function DataTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [domain, setDomain] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("lastUpdated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
    setSearchTimeout(timeout);
  };

  const hasActiveFilters = !!(debouncedSearch || domain || aiModel || sentiment);

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setDomain("");
    setAiModel("");
    setSentiment("");
    setPage(1);
  };

  const { data: filters } = trpc.urls.filters.useQuery();

  const { data, isLoading } = trpc.urls.list.useQuery({
    page,
    pageSize: 20,
    search: debouncedSearch || undefined,
    domain: domain || undefined,
    aiModel: aiModel || undefined,
    sentiment: sentiment || undefined,
    sortBy,
    sortOrder,
  });

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const columns: { key: SortField; label: string; className?: string }[] = [
    { key: "domain", label: "Domain" },
    { key: "title", label: "Title", className: "max-w-[200px] truncate" },
    { key: "aiModelMentioned", label: "AI Model" },
    { key: "visibilityScore", label: "Score" },
    { key: "sentiment", label: "Sentiment" },
    { key: "citationsCount", label: "Citations" },
    { key: "positionInResponse", label: "Position" },
    { key: "lastUpdated", label: "Updated" },
  ];

  const activeFilterCount = [debouncedSearch, domain, aiModel, sentiment].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by URL or title..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 pr-8"
            aria-label="Search URLs and titles"
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select
          value={aiModel}
          onChange={(e) => {
            setAiModel(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by AI model"
        >
          <option value="">All AI Models</option>
          {filters?.models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
        <Select
          value={sentiment}
          onChange={(e) => {
            setSentiment(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by sentiment"
        >
          <option value="">All Sentiments</option>
          {filters?.sentiments.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </Select>
        <Select
          value={domain}
          onChange={(e) => {
            setDomain(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by domain"
        >
          <option value="">All Domains</option>
          {filters?.domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground gap-1 shrink-0"
          >
            <X className="h-3.5 w-3.5" />
            Clear{activeFilterCount > 1 ? ` (${activeFilterCount})` : ""}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort(col.key)}
                  aria-sort={sortBy === col.key ? (sortOrder === "asc" ? "ascending" : "descending") : undefined}
                >
                  {col.label}
                  <SortIcon
                    field={col.key}
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              : data?.entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-medium">{entry.domain}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate" title={entry.title}>
                      {entry.title}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{entry.aiModelMentioned}</td>
                    <td className={`px-4 py-3 tabular-nums ${getScoreColor(entry.visibilityScore)}`}>
                      {entry.visibilityScore.toFixed(1)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getSentimentVariant(entry.sentiment)}>
                        {entry.sentiment}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{entry.citationsCount}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{entry.positionInResponse}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(entry.lastUpdated).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {/* Empty state for filtered results */}
        {!isLoading && data?.entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium mb-1">No entries found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {hasActiveFilters
                ? "No entries match your current filters. Try adjusting or clearing them."
                : "Upload a CSV file to populate the table."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {(data.page - 1) * data.pageSize + 1}-{Math.min(data.page * data.pageSize, data.total)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{data.total}</span>{" "}
            entries
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(1)}
              disabled={page === 1}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm tabular-nums">
              Page {data.page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(data.totalPages)}
              disabled={page === data.totalPages}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
