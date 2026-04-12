import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { io, type Socket } from "socket.io-client";
import { API_KEY_STORAGE_KEY } from "@repo/shared";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let globalSocket: Socket | null = null;

function getSocket(): Socket {
  if (!globalSocket) {
    const apiKey =
      typeof window !== "undefined"
        ? localStorage.getItem(API_KEY_STORAGE_KEY)
        : null;

    globalSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      auth: apiKey ? { apiKey } : {},
    });
  }
  return globalSocket;
}

/** Reconnect socket with a new API key (e.g. after recovery). */
export function reconnectWithKey(key: string) {
  if (globalSocket) {
    globalSocket.auth = { apiKey: key };
    globalSocket.disconnect().connect();
  }
}

export interface UploadProgress {
  succeeded: number;
  failed: number;
  total: number;
  percent: number;
}

export function useSocket(): MutableRefObject<Socket | null> {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = getSocket();
    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
    return () => {};
  }, []);

  return socketRef;
}

export function useRealtimeRefresh(refetchFns: Array<() => void>) {
  const socketRef = useSocket();

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = () => {
      for (const refetch of refetchFns) refetch();
    };

    socket.on("data:updated", handler);
    return () => {
      socket.off("data:updated", handler);
    };
  }, [socketRef, refetchFns]);
}

export function useUploadProgress() {
  const socketRef = useSocket();
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onStart = (data: { total: number }) => {
      setIsUploading(true);
      setProgress({ succeeded: 0, failed: 0, total: data.total, percent: 0 });
    };
    const onProgress = (data: UploadProgress) => setProgress(data);
    const onComplete = () => setIsUploading(false);

    socket.on("upload:start", onStart);
    socket.on("upload:progress", onProgress);
    socket.on("upload:complete", onComplete);

    return () => {
      socket.off("upload:start", onStart);
      socket.off("upload:progress", onProgress);
      socket.off("upload:complete", onComplete);
    };
  }, [socketRef]);

  return { progress, isUploading };
}
