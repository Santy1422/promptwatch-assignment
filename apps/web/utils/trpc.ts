import { createTRPCNext } from "@trpc/next";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@repo/api/src";
import { API_KEY_STORAGE_KEY } from "@repo/shared";

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/trpc`,
          headers() {
            if (typeof window === "undefined") return {};
            const key = localStorage.getItem(API_KEY_STORAGE_KEY);
            return key ? { "x-api-key": key } : {};
          },
        }),
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      },
    };
  },
  ssr: false,
});
