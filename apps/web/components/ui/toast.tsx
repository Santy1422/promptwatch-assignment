import { useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { cn } from "../../lib/utils";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
}

type ToastFn = (data: Omit<Toast, "id">) => void;

interface ToastContextType {
  toast: ToastFn;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((input: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...input, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-lg border bg-background p-4 shadow-lg animate-in slide-in-from-bottom-5 min-w-[320px]",
              t.variant === "destructive" && "border-destructive text-destructive",
              t.variant === "success" && "border-success text-success"
            )}
          >
            <p className="text-sm font-semibold">{t.title}</p>
            {t.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {t.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
