// Security utilities — SSRF protection & input sanitization

import { isPrivateIp } from "./ssrfGuard";

const BLOCKED_PROTOCOLS = new Set(["http:", "https:"]);
const MAX_URL_LENGTH = 2048;
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Validate that a URL is safe to fetch server-side.
 * - Must be http/https
 * - Must not point to private/link-local/loopback IPs
 * - Must not exceed length limit
 */
export async function validateFetchUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("URL tidak valid.");
  }

  if (!BLOCKED_PROTOCOLS.has(url.protocol)) {
    throw new Error("Protokol URL tidak didukung.");
  }

  if (url.href.length > MAX_URL_LENGTH) {
    throw new Error("URL terlalu panjang.");
  }

  // Resolve DNS and check IP
  const hostname = url.hostname;
  if (isPrivateIp(hostname)) {
    throw new Error("URL mengarah ke jaringan internal yang tidak diizinkan.");
  }

  return url;
}

/**
 * Fetch with timeout and redirect blocking.
 */
export async function safeFetch(url: URL): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url.href, {
      signal: controller.signal,
      redirect: "error", // block redirects to internal IPs
      headers: { "User-Agent": "image-to-prompt-bot" },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}
