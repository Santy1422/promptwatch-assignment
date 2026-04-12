/** Shared CORS origin configuration. */
export function getCorsOrigin(): string[] | boolean {
  if (process.env.NODE_ENV === "production") {
    const origin = process.env.CORS_ORIGIN || "http://localhost:3000";
    return origin.split(",").map((o) => o.trim());
  }
  return true;
}
