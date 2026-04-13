import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";
export const apiKeysRouter = router({
    /** Generate a fresh API key. Called once per new visitor. */
    generate: publicProcedure.mutation(async ({ ctx }) => {
        const record = await ctx.prisma.apiKey.create({ data: {} });
        return { key: record.key };
    }),
    /** Validate a pasted key and return confirmation with entry count. */
    recover: publicProcedure
        .input(z.object({ key: z.string() }))
        .mutation(async ({ ctx, input }) => {
        const record = await ctx.prisma.apiKey.findUnique({
            where: { key: input.key },
            select: {
                key: true,
                createdAt: true,
                _count: { select: { entries: true } },
            },
        });
        if (!record) {
            return { valid: false };
        }
        return {
            valid: true,
            key: record.key,
            createdAt: record.createdAt,
            entryCount: record._count.entries,
        };
    }),
});
//# sourceMappingURL=apiKeys.js.map