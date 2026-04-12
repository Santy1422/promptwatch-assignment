import { useState } from "react";
import { useApiKey } from "../lib/apiKey";
import { useToast } from "./ui/toast";
import { Copy, Check, Terminal, Monitor } from "lucide-react";

type Tab = "claude-desktop" | "claude-code";

export function McpSetup() {
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("claude-desktop");

  if (!apiKey) return null;

  const projectRoot = "$(pwd)"; // user replaces or it resolves in terminal
  const mcpPath = "packages/mcp/src/index.ts";

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        promptwatch: {
          command: "npx",
          args: ["tsx", mcpPath],
          env: {
            DATABASE_URL: "postgresql://repo:repo@localhost:5432/repo_development",
          },
        },
      },
    },
    null,
    2
  );

  const claudeCodeCommand = `claude mcp add promptwatch npx tsx ${mcpPath}`;

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: `${label} copied to clipboard`, variant: "success" });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b">
        <TabButton
          active={activeTab === "claude-desktop"}
          onClick={() => setActiveTab("claude-desktop")}
          icon={<Monitor className="h-3.5 w-3.5" />}
          label="Claude Desktop"
        />
        <TabButton
          active={activeTab === "claude-code"}
          onClick={() => setActiveTab("claude-code")}
          icon={<Terminal className="h-3.5 w-3.5" />}
          label="Claude Code"
        />
      </div>

      <div className="p-4">
        {activeTab === "claude-desktop" && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Add this to your Claude Desktop config file at{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">
                  ~/Library/Application Support/Claude/claude_desktop_config.json
                </code>
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Run from the project root directory:{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">
                  promptwatch-assignment/
                </code>
              </p>
            </div>
            <div className="relative">
              <pre className="rounded-lg bg-[#1e1e1e] text-[#d4d4d4] p-4 text-xs font-mono overflow-x-auto leading-relaxed">
                {claudeDesktopConfig}
              </pre>
              <CopyButton
                onClick={() => handleCopy(claudeDesktopConfig, "Config")}
                copied={copied === "Config"}
              />
            </div>
          </div>
        )}

        {activeTab === "claude-code" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Run this command from the project root to add the MCP server to Claude Code:
            </p>
            <div className="relative">
              <pre className="rounded-lg bg-[#1e1e1e] text-[#d4d4d4] p-4 text-xs font-mono overflow-x-auto leading-relaxed">
                {claudeCodeCommand}
              </pre>
              <CopyButton
                onClick={() => handleCopy(claudeCodeCommand, "Command")}
                copied={copied === "Command"}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Make sure <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">DATABASE_URL</code> is set in your environment or <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">.env</code> file.
            </p>
          </div>
        )}

        {/* API Key section */}
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">
            Your API key for MCP tool calls:
          </p>
          <div className="relative">
            <pre className="rounded-lg bg-[#1e1e1e] text-[#d4d4d4] p-3 text-xs font-mono">
              {apiKey}
            </pre>
            <CopyButton
              onClick={() => handleCopy(apiKey, "API key")}
              copied={copied === "API key"}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Pass this as the <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">apiKey</code> parameter when using the MCP tools.
          </p>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function CopyButton({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute top-2 right-2 rounded-md bg-white/10 p-1.5 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
