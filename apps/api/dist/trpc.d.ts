import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
export declare const createContext: ({ req }: CreateFastifyContextOptions) => Promise<{
    prisma: import("@repo/database").PrismaClient<import("@repo/database").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
    apiKey: string | null;
}>;
export type Context = Awaited<ReturnType<typeof createContext>>;
export declare const router: <TProcRouterRecord extends import("@trpc/server").ProcedureRouterRecord>(procedures: TProcRouterRecord) => import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: {
        prisma: import("@repo/database").PrismaClient<import("@repo/database").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
        apiKey: string | null;
    };
    meta: object;
    errorShape: import("@trpc/server").DefaultErrorShape;
    transformer: import("@trpc/server").DefaultDataTransformer;
}>, TProcRouterRecord>;
export declare const publicProcedure: import("@trpc/server").ProcedureBuilder<{
    _config: import("@trpc/server").RootConfig<{
        ctx: {
            prisma: import("@repo/database").PrismaClient<import("@repo/database").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
            apiKey: string | null;
        };
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: import("@trpc/server").DefaultDataTransformer;
    }>;
    _ctx_out: {
        prisma: import("@repo/database").PrismaClient<import("@repo/database").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
        apiKey: string | null;
    };
    _input_in: typeof import("@trpc/server").unsetMarker;
    _input_out: typeof import("@trpc/server").unsetMarker;
    _output_in: typeof import("@trpc/server").unsetMarker;
    _output_out: typeof import("@trpc/server").unsetMarker;
    _meta: object;
}>;
/** Middleware that requires a valid API key and attaches the record to context. */
export declare const authedProcedure: import("@trpc/server").ProcedureBuilder<{
    _config: import("@trpc/server").RootConfig<{
        ctx: {
            prisma: import("@repo/database").PrismaClient<import("@repo/database").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
            apiKey: string | null;
        };
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: import("@trpc/server").DefaultDataTransformer;
    }>;
    _meta: object;
    _ctx_out: {
        prisma: import("@repo/database").PrismaClient<import("@repo/database").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
        apiKey: string | null;
        apiKeyRecord: {
            id: string;
            key: string;
            label: string | null;
            createdAt: Date;
        };
    };
    _input_in: typeof import("@trpc/server").unsetMarker;
    _input_out: typeof import("@trpc/server").unsetMarker;
    _output_in: typeof import("@trpc/server").unsetMarker;
    _output_out: typeof import("@trpc/server").unsetMarker;
}>;
//# sourceMappingURL=trpc.d.ts.map