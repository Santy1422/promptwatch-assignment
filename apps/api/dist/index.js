import Fastify from "fastify";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { getCorsOrigin } from "@repo/shared";
import { appRouter } from "./routers/index.js";
import { createContext } from "./trpc.js";
import { initSocket } from "./socket.js";
import { registerUploadRoute } from "./routes/upload.js";
const fastify = Fastify({
    maxParamLength: 5000,
    bodyLimit: 10 * 1024 * 1024, // 10MB for CSV uploads
    logger: true,
});
const start = async () => {
    try {
        // Register CORS
        await fastify.register(cors, {
            origin: getCorsOrigin(),
            allowedHeaders: ["Content-Type", "x-api-key"],
            exposedHeaders: ["x-api-key"],
        });
        // Register multipart for file uploads
        await fastify.register(multipart, {
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
            },
        });
        // Register tRPC
        await fastify.register(fastifyTRPCPlugin, {
            prefix: "/trpc",
            trpcOptions: {
                router: appRouter,
                createContext,
                onError: ({ path, error }) => {
                    console.error(`tRPC failed on ${path ?? "<no-path>"}:`, error);
                },
            },
        });
        // Register CSV upload route (REST endpoint for multipart)
        registerUploadRoute(fastify);
        // Health check endpoint
        fastify.get("/health", async () => {
            return { status: "ok", timestamp: new Date().toISOString() };
        });
        const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
        const host = process.env.HOST ?? "0.0.0.0";
        await fastify.listen({ port, host });
        // Initialize Socket.IO on the same server
        initSocket(fastify.server);
        console.log(`Server listening on http://${host}:${port}`);
        console.log(`tRPC endpoint: http://${host}:${port}/trpc`);
        console.log(`WebSocket ready on ws://${host}:${port}`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map