import { initTRPC, TRPCError } from "@trpc/server";
import { prisma } from "@repo/database";
import { API_KEY_HEADER } from "@repo/shared";
export const createContext = async ({ req }) => {
    const apiKey = req.headers[API_KEY_HEADER];
    return { prisma, apiKey: apiKey ?? null };
};
const t = initTRPC.context().create();
export const router = t.router;
export const publicProcedure = t.procedure;
/** Middleware that requires a valid API key and attaches the record to context. */
export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.apiKey) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing x-api-key header" });
    }
    const keyRecord = await ctx.prisma.apiKey.findUnique({
        where: { key: ctx.apiKey },
    });
    if (!keyRecord) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid API key" });
    }
    return next({
        ctx: { ...ctx, apiKeyRecord: keyRecord },
    });
});
//# sourceMappingURL=trpc.js.map