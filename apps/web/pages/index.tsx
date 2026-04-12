import { useState, useCallback, useMemo } from "react";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import { useApiKey } from "../lib/apiKey";
import { useRealtimeRefresh } from "../lib/socket";
import { StatsCards } from "../components/StatsCards";
import { Charts } from "../components/Charts";
import { DataTable } from "../components/DataTable";
import { CsvUpload } from "../components/CsvUpload";
import { EmptyState } from "../components/EmptyState";
import { ExportButton } from "../components/ExportButton";
import { ApiKeyBar } from "../components/ApiKeyBar";
import { McpSetup } from "../components/McpSetup";
import { BarChart3, Upload, X, Terminal } from "lucide-react";

export default function Dashboard() {
  const { isReady } = useApiKey();
  const [showUpload, setShowUpload] = useState(false);
  const [showMcp, setShowMcp] = useState(false);

  const utils = trpc.useUtils();

  const statsQuery = trpc.urls.stats.useQuery(undefined, {
    enabled: isReady,
  });

  const filtersQuery = trpc.urls.filters.useQuery(undefined, {
    enabled: isReady,
  });

  // Realtime: invalidate all queries when data changes via WebSocket
  const invalidateAll = useCallback(() => { utils.invalidate(); }, [utils]);
  const refetchFns = useMemo(() => [invalidateAll], [invalidateAll]);
  useRealtimeRefresh(refetchFns);

  const handleUploadSuccess = useCallback(() => {
    utils.invalidate();
  }, [utils]);

  const stats = statsQuery.data;
  const hasData = stats && stats.totalUrls > 0;

  return (
    <>
      <Head>
        <title>AI Visibility Dashboard</title>
        <meta name="description" content="Track and analyze URL mentions across AI models" />
      </Head>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 shrink-0">
                <BarChart3 className="h-5 w-5" />
                <h1 className="text-sm font-semibold sm:text-base">AI Visibility Dashboard</h1>
              </div>
              <div className="flex items-center gap-3">
                <ApiKeyBar />
                {hasData && <ExportButton />}
                <button
                  type="button"
                  onClick={() => { setShowMcp(!showMcp); if (!showMcp) setShowUpload(false); }}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    showMcp
                      ? "bg-muted text-muted-foreground hover:bg-muted/80"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border"
                  }`}
                  title="Configure MCP server for Claude"
                >
                  {showMcp ? <X className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
                  <span className="hidden sm:inline">{showMcp ? "Close" : "MCP"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowUpload(!showUpload); if (!showUpload) setShowMcp(false); }}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    showUpload
                      ? "bg-muted text-muted-foreground hover:bg-muted/80"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {showUpload ? (
                    <>
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Close</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span className="hidden sm:inline">Upload CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* MCP setup section */}
          {showMcp && (
            <section>
              <McpSetup />
            </section>
          )}

          {/* Upload section */}
          {showUpload && (
            <section>
              <CsvUpload onSuccess={handleUploadSuccess} />
            </section>
          )}

          {/* Empty state - first time user */}
          {!statsQuery.isLoading && !hasData && !showUpload && !showMcp && (
            <EmptyState onUploadClick={() => setShowUpload(true)} onMcpClick={() => setShowMcp(true)} />
          )}

          {/* Dashboard content */}
          {(hasData || statsQuery.isLoading) && (
            <>
              <section>
                <SectionHeader title="Overview" />
                <StatsCards
                  totalUrls={stats?.totalUrls ?? 0}
                  uniqueDomains={stats?.uniqueDomains ?? 0}
                  avgVisibilityScore={stats?.avgVisibilityScore ?? 0}
                  mostActiveModel={stats?.mostActiveModel ?? "N/A"}
                  isLoading={statsQuery.isLoading}
                />
              </section>

              <section>
                <SectionHeader title="Analytics" />
                <Charts
                  byDomain={stats?.byDomain ?? []}
                  byDate={stats?.byDate ?? []}
                  isLoading={statsQuery.isLoading}
                />
              </section>

              <section>
                <SectionHeader title="URL Entries" />
                <DataTable />
              </section>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t mt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-xs text-muted-foreground text-center">
              AI Visibility Dashboard &middot; Real-time via WebSocket &middot; MCP server available for Claude integration
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
      {title}
    </h2>
  );
}
