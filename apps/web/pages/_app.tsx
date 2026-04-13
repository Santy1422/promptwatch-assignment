import type { AppProps } from "next/app";
import { trpc } from "../utils/trpc";
import { ToastProvider } from "../components/ui/toast";
import { ApiKeyProvider } from "../lib/apiKey";
import { ErrorBoundary } from "../components/ErrorBoundary";
import "../styles/globals.css";

function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ApiKeyProvider>
          <Component {...pageProps} />
        </ApiKeyProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default trpc.withTRPC(App);
