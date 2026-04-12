import type { FastifyInstance } from "fastify";
import { prisma } from "@repo/database";
import { parseCsv, processBatches, API_KEY_HEADER } from "@repo/shared";
import { getIO } from "../socket.js";

export function registerUploadRoute(fastify: FastifyInstance) {
  fastify.post("/api/upload", async (request, reply) => {
    // Validate API key
    const apiKeyValue = request.headers[API_KEY_HEADER] as string | undefined;
    if (!apiKeyValue) {
      return reply.status(401).send({ error: "Missing x-api-key header" });
    }

    const keyRecord = await prisma.apiKey.findUnique({ where: { key: apiKeyValue } });
    if (!keyRecord) {
      return reply.status(401).send({ error: "Invalid API key" });
    }

    // Parse uploaded file
    const file = await request.file();
    if (!file) {
      return reply.status(400).send({ error: "No file provided" });
    }
    if (!file.filename.endsWith(".csv")) {
      return reply.status(400).send({ error: "Only .csv files are accepted" });
    }

    const buffer = await file.toBuffer();
    const { validRows, errors } = parseCsv(buffer.toString("utf-8"));

    if (errors.length > 0 && validRows.length === 0) {
      return reply.status(400).send({ error: "CSV parsing failed", details: errors });
    }
    if (validRows.length === 0) {
      return reply.status(400).send({ error: "No valid entries found in CSV" });
    }

    const io = getIO();
    io.to(apiKeyValue).emit("upload:start", { total: validRows.length });

    const { succeeded, failed } = await processBatches(
      validRows,
      (row, data) =>
        prisma.urlEntry.upsert({
          where: { apiKeyId_url: { apiKeyId: keyRecord.id, url: row.url } },
          create: { url: row.url, apiKeyId: keyRecord.id, ...data },
          update: data,
        }),
      (progress) => io.to(apiKeyValue).emit("upload:progress", progress)
    );

    io.to(apiKeyValue).emit("upload:complete", { succeeded, failed, total: validRows.length });
    io.to(apiKeyValue).emit("data:updated");

    return reply.send({ succeeded, failed, total: validRows.length });
  });
}
