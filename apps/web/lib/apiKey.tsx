import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { trpc } from "../utils/trpc";
import { API_KEY_STORAGE_KEY } from "@repo/shared";
import { reconnectWithKey } from "./socket";

interface ApiKeyContextValue {
  apiKey: string | null;
  isReady: boolean;
  recover: (key: string) => Promise<{ valid: boolean; entryCount?: number }>;
  reset: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const generateMutation = trpc.apiKeys.generate.useMutation();
  const recoverMutation = trpc.apiKeys.recover.useMutation();

  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (stored) {
      setApiKey(stored);
      setIsReady(true);
    } else {
      generateMutation.mutateAsync().then((result) => {
        localStorage.setItem(API_KEY_STORAGE_KEY, result.key);
        setApiKey(result.key);
        setIsReady(true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recover = useCallback(
    async (key: string) => {
      const result = await recoverMutation.mutateAsync({ key });
      if (result.valid) {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
        setApiKey(key);
        reconnectWithKey(key);
        return { valid: true, entryCount: result.entryCount };
      }
      return { valid: false };
    },
    [recoverMutation]
  );

  const reset = useCallback(async () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey(null);
    setIsReady(false);
    const result = await generateMutation.mutateAsync();
    localStorage.setItem(API_KEY_STORAGE_KEY, result.key);
    setApiKey(result.key);
    reconnectWithKey(result.key);
    setIsReady(true);
    return result.key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ApiKeyContext.Provider value={{ apiKey, isReady, recover, reset }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error("useApiKey must be used within ApiKeyProvider");
  return ctx;
}
