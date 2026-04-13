import { useState, useCallback, useRef, type DragEvent } from "react";
import { Button } from "./ui/button";
import { useToast } from "./ui/toast";
import { useUploadProgress } from "../lib/socket";
import { API_KEY_STORAGE_KEY } from "@repo/shared";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type UploadState = "idle" | "uploading" | "success" | "error";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
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
        setErrorMessage("Only .csv files are accepted.");
        setState("error");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage("File too large (max 10MB).");
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
        if (!response.ok) throw new Error(data.error || "Upload failed");

        setResult({ succeeded: data.succeeded, failed: data.failed });
        setState("success");
        toast({
          title: `${data.succeeded} URLs imported`,
          description: data.failed > 0 ? `${data.failed} failed` : undefined,
          variant: "success",
        });
        onSuccess?.();
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Upload failed");
        setState("error");
      }
    },
    [toast, onSuccess]
  );

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
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

  const reset = () => {
    setState("idle");
    setResult(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const showProgress = state === "uploading" && isUploading && progress;

  return (
    <div
      className={`rounded-xl border bg-card shadow-sm p-8 text-center transition-all duration-200 ${
        dragActive ? "bg-primary/5 ring-2 ring-primary ring-inset" : "hover:bg-muted/20"
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
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
        className="hidden"
      />

      {state === "idle" && (
        <div className="flex flex-col items-center gap-3">
          <div className={`rounded-full p-3 ${dragActive ? "bg-primary/10" : "bg-muted"}`}>
            <Upload className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-medium">
              Drop your CSV here or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Headers: url, title, ai_model_mentioned, visibility_score, sentiment, citations_count...
            </p>
          </div>
        </div>
      )}

      {state === "uploading" && (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-medium">Importing...</p>
          {showProgress && (
            <div className="w-64">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {progress.succeeded + progress.failed}/{progress.total} entries
              </p>
            </div>
          )}
        </div>
      )}

      {state === "success" && result && (
        <div className="flex flex-col items-center gap-3">
          <CheckCircle className="h-8 w-8 text-success" />
          <p className="text-sm font-medium">{result.succeeded} URLs imported</p>
          <Button variant="outline" size="sm" onClick={reset}>Upload another</Button>
        </div>
      )}

      {state === "error" && (
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive font-medium">{errorMessage}</p>
          <Button variant="outline" size="sm" onClick={reset}>Try again</Button>
        </div>
      )}
    </div>
  );
}
