import { useState } from "react";
import { useApiKey } from "../lib/apiKey";
import { useToast } from "./ui/toast";
import { Copy, Check } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function McpSetup() {
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  if (!apiKey) return null;

  const projectPath = "/path/to/promptwatch-assignment";

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        promptwatch: {
          command: "npx",
          args: ["tsx", `${projectPath}/packages/mcp/src/index.ts`],
          env: { API_URL },
        },
      },
    },
    null,
    2
  );

  const claudeCodeCommand = `claude mcp add promptwatch -e API_URL=${API_URL} -- npx tsx packages/mcp/src/index.ts`;

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: `Copied!`, variant: "success" });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm p-5 space-y-5">
      <div>
        <h3 className="text-sm font-semibold mb-1">Connect Claude to your data</h3>
        <p className="text-xs text-muted-foreground">
          The MCP server lets Claude upload CSVs, query URLs, and get stats using your API key.
        </p>
      </div>

      {/* Step 1: API Key */}
      <Step number={1} title="Your API key">
        <p className="text-xs text-muted-foreground mb-2">
          Claude will ask for this when calling any tool.
        </p>
        <CodeBlock
          text={apiKey}
          onCopy={() => handleCopy(apiKey, "key")}
          copied={copied === "key"}
        />
      </Step>

      {/* Step 2: Claude Desktop */}
      <Step number={2} title="Claude Desktop">
        <p className="text-xs text-muted-foreground mb-2">
          Add to{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">
            ~/Library/Application Support/Claude/claude_desktop_config.json
          </code>
          {" "}— replace <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">/path/to/</code> with your actual project path.
        </p>
        <CodeBlock
          text={claudeDesktopConfig}
          onCopy={() => handleCopy(claudeDesktopConfig, "desktop")}
          copied={copied === "desktop"}
        />
      </Step>

      {/* Step 3: Claude Code */}
      <Step number={3} title="Claude Code">
        <p className="text-xs text-muted-foreground mb-2">
          Run from the project root:
        </p>
        <CodeBlock
          text={claudeCodeCommand}
          onCopy={() => handleCopy(claudeCodeCommand, "code")}
          copied={copied === "code"}
        />
      </Step>

      {/* Available tools */}
      <div className="pt-3 border-t">
        <p className="text-xs font-medium mb-2">Available tools</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: "upload_csv", desc: "Import a CSV file" },
            { name: "query_urls", desc: "Search & filter URLs" },
            { name: "get_stats", desc: "Aggregated statistics" },
            { name: "get_url_detail", desc: "Full URL details" },
          ].map((tool) => (
            <div key={tool.name} className="rounded-lg bg-muted/50 px-3 py-2">
              <code className="text-xs font-mono font-medium">{tool.name}</code>
              <p className="text-[11px] text-muted-foreground">{tool.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
        {number}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium mb-1">{title}</p>
        {children}
      </div>
    </div>
  );
}

function CodeBlock({ text, onCopy, copied }: { text: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="relative">
      <pre className="rounded-lg bg-[#1e1e1e] text-[#d4d4d4] p-3 text-xs font-mono overflow-x-auto leading-relaxed pr-10">
        {text}
      </pre>
      <button
        type="button"
        onClick={onCopy}
        className="absolute top-2 right-2 rounded-md bg-white/10 p-1.5 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
        title="Copy"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
