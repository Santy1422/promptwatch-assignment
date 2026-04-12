import { useState, useCallback, useRef, type DragEvent } from "react";
import { Button } from "./ui/button";
import { useToast } from "./ui/toast";
import { useUploadProgress } from "../lib/socket";
import { API_KEY_STORAGE_KEY } from "@repo/shared";
import { Upload, CheckCircle, AlertCircle, Loader2, FileSpreadsheet, Info } from "lucide-react";

type UploadState = "idle" | "uploading" | "success" | "error";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function CsvUpload({ onSuccess }: { onSuccess?: () => void }) {
  const [state, setState] = useState<UploadState>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState<{ succeeded: number; failed: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { progress, isUploading } = useUploadProgress();

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".csv")) {
        setErrorMessage("Only .csv files are accepted. Please select a valid CSV file.");
        setState("error");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage("File is too large (max 10MB). Try splitting it into smaller files.");
        setState("error");
        return;
      }

      setState("uploading");
      setErrorMessage("");

      try {
        const formData = new FormData();
        formData.append("file", file);

        const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        const response = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          body: formData,
          headers: apiKey ? { "x-api-key": apiKey } : {},
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Upload failed");
        }

        setResult({ succeeded: data.succeeded, failed: data.failed });
        setState("success");
        toast({
          title: `${data.succeeded} URLs imported successfully`,
          description: data.failed > 0 ? `${data.failed} entries failed to import` : undefined,
          variant: "success",
        });
        onSuccess?.();
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Upload failed");
        setState("error");
        toast({
          title: "Upload failed",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
      }
    },
    [toast, onSuccess]
  );

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const reset = () => {
    setState("idle");
    setResult(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const showProgress = state === "uploading" && isUploading && progress;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Upload area */}
      <div
        className={`relative p-8 text-center transition-all duration-200 ${
          dragActive
            ? "bg-primary/5 ring-2 ring-primary ring-inset"
            : state === "error"
              ? "bg-destructive/5"
              : state === "success"
                ? "bg-success/5"
                : "hover:bg-muted/30"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
          aria-label="Upload CSV file"
        />

        {state === "idle" && (
          <div className="flex flex-col items-center gap-4">
            <div className={`rounded-full p-3 transition-colors ${dragActive ? "bg-primary/10" : "bg-muted"}`}>
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-base font-medium mb-1">
                Drag & drop your CSV file here
              </p>
              <p className="text-sm text-muted-foreground">
                or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary font-medium underline underline-offset-4 hover:text-primary/80 transition-colors"
                >
                  browse your files
                </button>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              CSV files only &middot; Max 10MB &middot; Parsed securely on the server
            </p>
          </div>
        )}

        {state === "uploading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div>
              <p className="text-base font-medium mb-1">Processing your file...</p>
              <p className="text-sm text-muted-foreground">
                Validating and importing entries into the database
              </p>
            </div>
            {showProgress && (
              <div className="w-72 mx-auto">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{progress.succeeded + progress.failed} of {progress.total} entries</span>
                  <span>{progress.percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                {progress.failed > 0 && (
                  <p className="text-xs text-warning mt-1">
                    {progress.failed} entries had issues
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {state === "success" && result && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-success/10 p-3">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div>
              <p className="text-base font-medium mb-1">
                {result.succeeded} URLs imported successfully
              </p>
              {result.failed > 0 && (
                <p className="text-sm text-warning">
                  {result.failed} entries could not be imported
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Your dashboard has been updated with the new data
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              Upload another file
            </Button>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <p className="text-base font-medium text-destructive mb-1">
                Upload failed
              </p>
              <p className="text-sm text-muted-foreground">
                {errorMessage}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              Try again
            </Button>
          </div>
        )}
      </div>

      {/* Format help - only in idle state */}
      {state === "idle" && (
        <div className="border-t bg-muted/20 px-6 py-3">
          <div className="flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium">CSV format:</span> Include headers like{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">url</code>,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">title</code>,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">ai_model_mentioned</code>,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">visibility_score</code>,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">sentiment</code>, etc.
              Duplicate URLs are updated automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
