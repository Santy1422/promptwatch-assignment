import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { getCorsOrigin } from "@repo/shared";

let io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: getCorsOrigin(),
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    const apiKey = socket.handshake.auth?.apiKey as string | undefined;
    if (apiKey) {
      socket.join(apiKey);
    }

    socket.on("disconnect", () => {
      // cleanup handled by Socket.IO
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}
