import type { AppProps } from "next/app";
import { trpc } from "../utils/trpc";
import { ToastProvider } from "../components/ui/toast";
import { ApiKeyProvider } from "../lib/apiKey";
import "../styles/globals.css";

function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <ApiKeyProvider>
        <Component {...pageProps} />
      </ApiKeyProvider>
    </ToastProvider>
  );
}

export default trpc.withTRPC(App);
