/**
 * Extract clean domain from a URL, stripping www. prefix.
 * Returns the original string if the URL is invalid.
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
