export declare const appRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: {
        prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
        apiKey: string | null;
    };
    meta: object;
    errorShape: import("@trpc/server").DefaultErrorShape;
    transformer: import("@trpc/server").DefaultDataTransformer;
}>, {
    hello: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: {
            prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
            apiKey: string | null;
        };
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: import("@trpc/server").DefaultDataTransformer;
    }>, {
        world: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: {
                    prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
                    apiKey: string | null;
                };
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: import("@trpc/server").DefaultDataTransformer;
            }>;
            _ctx_out: {
                prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
                apiKey: string | null;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
            _meta: object;
        }, string>;
    }>;
    urls: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: {
            prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
            apiKey: string | null;
        };
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: import("@trpc/server").DefaultDataTransformer;
    }>, {
        upload: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: {
                    prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
                    apiKey: string | null;
                };
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: import("@trpc/server").DefaultDataTransformer;
            }>;
            _meta: object;
            _ctx_out: {
                prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
                apiKey: string | null;
                apiKeyRecord: {
                    id: string;
                    key: string;
                    label: string | null;
                    createdAt: Date;
                };
            };
            _input_in: {
                entries: {
                    url: string;
                    title: string;
                    aiModelMentioned: string;
                    citationsCount: number;
                    sentiment: string;
                    visibilityScore: number;
                    competitorMentioned: string;
                    queryCategory: string;
                    lastUpdated: string | Date;
                    trafficEstimate: number;
                    domainAuthority: number;
                    mentionsCount: number;
                    positionInResponse: number;
                    responseType: string;
                    geographicRegion: string;
                }[];
            };
            _input_out: {
                entries: {
                    url: string;
                    title: string;
                    aiModelMentioned: string;
                    citationsCount: number;
                    sentiment: string;
                    visibilityScore: number;
                    competitorMentioned: string;
                    queryCategory: string;
                    lastUpdated: string | Date;
                    trafficEstimate: number;
                    domainAuthority: number;
                    mentionsCount: number;
                    positionInResponse: number;
                    responseType: string;
                    geographicRegion: string;
                }[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            succeeded: number;
            failed: number;
            total: number;
        }>;
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: {
                    prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
                    apiKey: string | null;
                };
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: import("@trpc/server").DefaultDataTransformer;
            }>;
            _meta: object;
            _ctx_out: {
                prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
                apiKey: string | null;
                apiKeyRecord: {
                    id: string;
                    key: string;
                    label: string | null;
                    createdAt: Date;
                };
            };
            _input_in: {
                search?: string | undefined;
                page?: number | undefined;
                pageSize?: number | undefined;
                domain?: string | undefined;
                aiModel?: string | undefined;
                sentiment?: string | undefined;
                sortBy?: "domain" | "sentiment" | "title" | "aiModelMentioned" | "visibilityScore" | "citationsCount" | "positionInResponse" | "lastUpdated" | undefined;
                sortOrder?: "asc" | "desc" | undefined;
            };
            _input_out: {
                page: number;
                pageSize: number;
                sortBy: "domain" | "sentiment" | "title" | "aiModelMentioned" | "visibilityScore" | "citationsCount" | "positionInResponse" | "lastUpdated";
                sortOrder: "asc" | "desc";
                search?: string | undefined;
                domain?: string | undefined;
                aiModel?: string | undefined;
                sentiment?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            entries: {
                id: string;
                createdAt: Date;
                domain: string;
                sentiment: string;
                title: string;
                aiModelMentioned: string;
                visibilityScore: number;
                citationsCount: number;
                positionInResponse: number;
                lastUpdated: Date;
                url: string;
                competitorMentioned: string;
                queryCategory: string;
                trafficEstimate: number;
                domainAuthority: number;
                mentionsCount: number;
                responseType: string;
                geographicRegion: string;
                apiKeyId: string;
            }[];
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
        }>;
        stats: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: {
                    prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
                    apiKey: string | null;
                };
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: import("@trpc/server").DefaultDataTransformer;
            }>;
            _meta: object;
            _ctx_out: {
                prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
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
        }, {
            totalUrls: number;
            uniqueDomains: number;
            avgVisibilityScore: number;
            mostActiveModel: string;
            byDomain: {
                domain: string;
                count: number;
                avgScore: number;
            }[];
            byDate: {
                date: string;
                count: number;
            }[];
            byModel: {
                model: string;
                count: number;
            }[];
            bySentiment: {
                sentiment: string;
                count: number;
            }[];
        }>;
        filters: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: {
                    prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
                    apiKey: string | null;
                };
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: import("@trpc/server").DefaultDataTransformer;
            }>;
            _meta: object;
            _ctx_out: {
                prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
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
        }, {
            domains: string[];
            models: string[];
            sentiments: string[];
        }>;
    }>;
    apiKeys: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: {
            prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
            apiKey: string | null;
        };
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: import("@trpc/server").DefaultDataTransformer;
    }>, {
        generate: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: {
                    prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
                    apiKey: string | null;
                };
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: import("@trpc/server").DefaultDataTransformer;
            }>;
            _ctx_out: {
                prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
                apiKey: string | null;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
            _meta: object;
        }, {
            key: string;
        }>;
        recover: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: {
                    prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
                    apiKey: string | null;
                };
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: import("@trpc/server").DefaultDataTransformer;
            }>;
            _meta: object;
            _ctx_out: {
                prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
                apiKey: string | null;
            };
            _input_in: {
                key: string;
            };
            _input_out: {
                key: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            valid: false;
            key?: undefined;
            createdAt?: undefined;
            entryCount?: undefined;
        } | {
            valid: true;
            key: string;
            createdAt: Date;
            entryCount: number;
        }>;
    }>;
}>;
export type AppRouter = typeof appRouter;
//# sourceMappingURL=index.d.ts.map