import { Server as SocketServer } from "socket.io";
import { getCorsOrigin } from "@repo/shared";
let io = null;
export function initSocket(httpServer) {
    io = new SocketServer(httpServer, {
        cors: {
            origin: getCorsOrigin(),
            methods: ["GET", "POST"],
        },
    });
    io.on("connection", (socket) => {
        const apiKey = socket.handshake.auth?.apiKey;
        if (apiKey) {
            socket.join(apiKey);
        }
        socket.on("disconnect", () => {
            // cleanup handled by Socket.IO
        });
    });
    return io;
}
export function getIO() {
    if (!io)
        throw new Error("Socket.IO not initialized");
    return io;
}
//# sourceMappingURL=socket.js.map