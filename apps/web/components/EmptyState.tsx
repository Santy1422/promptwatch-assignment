import { Upload, FileSpreadsheet, BarChart3, ArrowRight, Table, KeyRound, Terminal } from "lucide-react";

const EXPECTED_COLUMNS = [
  "url", "title", "ai_model_mentioned", "citations_count",
  "sentiment", "visibility_score", "last_updated",
];

export function EmptyState({ onUploadClick, onMcpClick }: { onUploadClick?: () => void; onMcpClick?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Hero */}
      <div className="rounded-full bg-primary/5 p-4 mb-6">
        <BarChart3 className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Welcome to AI Visibility Dashboard</h2>
      <p className="text-muted-foreground mb-10 max-w-lg">
        Track how your URLs appear across AI models like ChatGPT, Claude, Gemini, and Perplexity.
        Upload a CSV to start analyzing your visibility data.
      </p>

      {/* How it works steps */}
      <div className="grid gap-6 sm:grid-cols-3 max-w-2xl w-full mb-10">
        <Step
          number={1}
          icon={Upload}
          title="Upload CSV"
          description="Drag & drop or browse for your CSV file with AI visibility data"
        />
        <Step
          number={2}
          icon={Table}
          title="View & Filter"
          description="Browse entries with search, filters, sorting, and pagination"
        />
        <Step
          number={3}
          icon={BarChart3}
          title="Analyze"
          description="See charts and stats about domains, models, sentiment, and trends"
        />
      </div>

      {/* CTA */}
      {onUploadClick && (
        <button
          type="button"
          onClick={onUploadClick}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Upload className="h-4 w-4" />
          Upload your first CSV
          <ArrowRight className="h-4 w-4" />
        </button>
      )}

      {/* CSV format hint */}
      <div className="mt-10 rounded-lg border bg-muted/30 p-4 max-w-lg w-full text-left">
        <div className="flex items-center gap-2 mb-2">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Expected CSV columns
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EXPECTED_COLUMNS.map((col) => (
            <code
              key={col}
              className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground"
            >
              {col}
            </code>
          ))}
          <span className="text-xs text-muted-foreground self-center">+ 8 more</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Use snake_case headers. All 15 columns are required.
        </p>
      </div>

      {/* API key + MCP hints */}
      <div className="mt-6 grid gap-3 max-w-lg w-full text-left">
        <div className="flex items-start gap-2.5 rounded-lg border bg-muted/20 p-3">
          <KeyRound className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium mb-0.5">Your API Key</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Generated automatically. Copy it from the header bar to recover your data on another device.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onMcpClick}
          className="flex items-start gap-2.5 rounded-lg border bg-muted/20 p-3 text-left hover:border-primary/30 hover:bg-muted/40 transition-all group w-full"
        >
          <Terminal className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
          <div>
            <p className="text-xs font-medium mb-0.5">MCP Server Available</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload CSVs and query data from Claude Desktop or Claude Code. Click here to see setup instructions.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

function Step({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="relative">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-background">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {number}
        </span>
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
