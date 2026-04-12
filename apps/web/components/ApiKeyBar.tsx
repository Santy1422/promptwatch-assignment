import { useState } from "react";
import { useApiKey } from "../lib/apiKey";
import { useToast } from "./ui/toast";
import { trpc } from "../utils/trpc";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Copy, Check, KeyRound, RotateCcw, HelpCircle, X, LogOut } from "lucide-react";

export function ApiKeyBar() {
  const { apiKey, recover, reset } = useApiKey();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [copied, setCopied] = useState(false);
  const [showRecover, setShowRecover] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [recoverInput, setRecoverInput] = useState("");
  const [recovering, setRecovering] = useState(false);

  const handleCopy = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast({ title: "API key copied to clipboard", variant: "success" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecover = async () => {
    const key = recoverInput.trim();
    if (!key) return;

    setRecovering(true);
    try {
      const result = await recover(key);
      if (result.valid) {
        toast({
          title: "Data recovered successfully",
          description: `Found ${result.entryCount ?? 0} entries linked to this key`,
          variant: "success",
        });
        setShowRecover(false);
        setRecoverInput("");
        utils.invalidate();
      } else {
        toast({
          title: "Key not found",
          description: "No data exists for this API key. Check and try again.",
          variant: "destructive",
        });
      }
    } finally {
      setRecovering(false);
    }
  };

  const handleLogout = async () => {
    const newKey = await reset();
    setShowLogoutConfirm(false);
    utils.invalidate();
    toast({
      title: "Session closed",
      description: "A new API key has been generated. Save your old key if you need to recover your data later.",
    });
  };

  if (!apiKey) return null;

  const truncated = `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;

  return (
    <div className="relative flex items-center gap-2">
      {/* Recover mode */}
      {showRecover ? (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
          <Input
            value={recoverInput}
            onChange={(e) => setRecoverInput(e.target.value)}
            placeholder="Paste your existing API key..."
            className="h-8 w-72 text-xs font-mono"
            onKeyDown={(e) => e.key === "Enter" && handleRecover()}
            autoFocus
          />
          <Button
            variant="default"
            size="sm"
            onClick={handleRecover}
            disabled={recovering || !recoverInput.trim()}
            className="h-8"
          >
            {recovering ? "Recovering..." : "Load Data"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowRecover(false);
              setRecoverInput("");
            }}
            className="h-8 px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

      /* Logout confirmation */
      ) : showLogoutConfirm ? (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
          <span className="text-xs text-muted-foreground">
            Close session? Save your key first to recover data later.
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className="h-8"
          >
            Confirm
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogoutConfirm(false)}
            className="h-8 px-2"
          >
            Cancel
          </Button>
        </div>

      /* Default state */
      ) : (
        <>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all group"
            title="Click to copy your API key"
          >
            <KeyRound className="h-3 w-3 group-hover:text-primary transition-colors" />
            <span>{truncated}</span>
            {copied ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <Copy className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowRecover(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Already have a key? Paste it to load your existing data"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Recover</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            title="Close this session and start fresh"
          >
            <LogOut className="h-3 w-3" />
            <span className="hidden sm:inline">Logout</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="What is this key?"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </>
      )}

      {/* Help tooltip */}
      {showHelp && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-lg border bg-card p-4 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold">Your API Key</h4>
            <button type="button" onClick={() => setShowHelp(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              This key was generated automatically when you first visited. It links all your uploaded data to you.
            </p>
            <p>
              <span className="font-medium text-foreground">Save it somewhere safe.</span> You'll need it to access your data from another device or the MCP server.
            </p>
            <p>
              Use <span className="font-medium">Recover</span> to load data from an existing key, or <span className="font-medium">Logout</span> to start a fresh session.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
