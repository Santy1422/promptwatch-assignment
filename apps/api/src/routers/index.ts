import { router } from "../trpc.js";
import { urlsRouter } from "./urls.js";
import { apiKeysRouter } from "./apiKeys.js";

export const appRouter = router({
  urls: urlsRouter,
  apiKeys: apiKeysRouter,
});

export type AppRouter = typeof appRouter;
