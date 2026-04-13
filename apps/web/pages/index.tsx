import { useCallback, useMemo } from "react";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import { useApiKey } from "../lib/apiKey";
import { useRealtimeRefresh } from "../lib/socket";
import { StatsCards } from "../components/StatsCards";
import { Charts } from "../components/Charts";
import { DataTable } from "../components/DataTable";
import { CsvUpload } from "../components/CsvUpload";
import { ExportButton } from "../components/ExportButton";
import { ApiKeyBar } from "../components/ApiKeyBar";
import { McpSetup } from "../components/McpSetup";
import { BarChart3 } from "lucide-react";

export default function Dashboard() {
  const { isReady } = useApiKey();
  const utils = trpc.useUtils();

  const statsQuery = trpc.urls.stats.useQuery(undefined, { enabled: isReady });

  const invalidateAll = useCallback(() => { utils.invalidate(); }, [utils]);
  const refetchFns = useMemo(() => [invalidateAll], [invalidateAll]);
  useRealtimeRefresh(refetchFns);

  const handleUploadSuccess = useCallback(() => { utils.invalidate(); }, [utils]);

  const stats = statsQuery.data;
  const hasData = stats && stats.totalUrls > 0;

  return (
    <>
      <Head>
        <title>AI Visibility Dashboard</title>
        <meta name="description" content="Track and analyze URL mentions across AI models" />
      </Head>

      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <BarChart3 className="h-5 w-5" />
                <h1 className="text-sm font-semibold sm:text-base">AI Visibility Dashboard</h1>
              </div>
              <div className="flex items-center gap-3">
                <ApiKeyBar />
                {hasData && <ExportButton />}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* No data yet: upload + MCP instructions */}
          {!statsQuery.isLoading && !hasData && (
            <>
              <div className="text-center pt-8 pb-2">
                <h2 className="text-xl font-semibold mb-1">Upload your CSV to get started</h2>
                <p className="text-sm text-muted-foreground">
                  Import your AI visibility data and see analytics instantly
                </p>
              </div>
              <CsvUpload onSuccess={handleUploadSuccess} />
              <McpSetup />
            </>
          )}

          {/* Has data: full dashboard */}
          {(hasData || statsQuery.isLoading) && (
            <>
              <CsvUpload onSuccess={handleUploadSuccess} />

              <StatsCards
                totalUrls={stats?.totalUrls ?? 0}
                uniqueDomains={stats?.uniqueDomains ?? 0}
                avgVisibilityScore={stats?.avgVisibilityScore ?? 0}
                mostActiveModel={stats?.mostActiveModel ?? "N/A"}
                isLoading={statsQuery.isLoading}
              />

              <Charts
                byDomain={stats?.byDomain ?? []}
                byDate={stats?.byDate ?? []}
                isLoading={statsQuery.isLoading}
              />

              <DataTable />
            </>
          )}
        </main>

        <footer className="border-t mt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-xs text-muted-foreground text-center">
              AI Visibility Dashboard &middot; Real-time via WebSocket
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
