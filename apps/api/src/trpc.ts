import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { prisma } from "@repo/database";
import { API_KEY_HEADER } from "@repo/shared";

export const createContext = async ({ req }: CreateFastifyContextOptions) => {
  const apiKey = req.headers[API_KEY_HEADER] as string | undefined;
  return { prisma, apiKey: apiKey ?? null };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

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
