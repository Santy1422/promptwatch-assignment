import { router } from "../trpc.js";
import { helloRouter } from "./hello.js";
import { urlsRouter } from "./urls.js";
import { apiKeysRouter } from "./apiKeys.js";
export const appRouter = router({
    hello: helloRouter,
    urls: urlsRouter,
    apiKeys: apiKeysRouter,
});
//# sourceMappingURL=index.js.map