// SSRF guard — IP allowlist check

import { isIP } from "net";

// RFC 1918 + link-local + loopback + metadata ranges
const PRIVATE_PREFIXES = [
  "127.", "10.", "0.",
  "169.254.", // link-local / cloud metadata
  "192.168.",
  "172.16.", "172.17.", "172.18.", "172.19.",
  "172.20.", "172.21.", "172.22.", "172.23.",
  "172.24.", "172.25.", "172.26.", "172.27.",
  "172.28.", "172.29.", "172.30.", "172.31.",
];

/**
 * Quick check: does hostname look like a private IP?
 * Does NOT do DNS resolution — caller must resolve separately.
 */
export function isPrivateIp(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "[::1]" || h === "0.0.0.0") return true;
  for (const prefix of PRIVATE_PREFIXES) {
    if (h.startsWith(prefix)) return true;
  }
  return false;
}
