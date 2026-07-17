// Error handling utilities — safe error responses for clients

export function sanitizeError(err: any): string {
  // Never expose internal details to clients
  if (err?.code === "ECONNREFUSED" || err?.code === "ENOTFOUND") {
    return "Layanan sedang tidak tersedia. Silakan coba lagi nanti.";
  }
  if (err?.name === "AbortError") {
    return "Permintaan timeout. Silakan coba lagi.";
  }
  if (err?.status === 429) {
    return "Terlalu banyak permintaan. Silakan tunggu sebentar.";
  }
  // Generic fallback
  return "Terjadi kesalahan internal. Silakan coba lagi nanti.";
}
