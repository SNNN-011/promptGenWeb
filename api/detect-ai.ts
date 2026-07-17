import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

// ---- SSRF Guard ----
function isPrivateIp(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "[::1]" || h === "0.0.0.0") return true;
  const PRIVATE_PREFIXES = [
    "127.", "10.", "0.", "169.254.", "192.168.",
    "172.16.", "172.17.", "172.18.", "172.19.",
    "172.20.", "172.21.", "172.22.", "172.23.",
    "172.24.", "172.25.", "172.26.", "172.27.",
    "172.28.", "172.29.", "172.30.", "172.31.",
  ];
  for (const prefix of PRIVATE_PREFIXES) {
    if (h.startsWith(prefix)) return true;
  }
  return false;
}

async function validateFetchUrl(raw: string): Promise<URL> {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("URL tidak valid."); }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Protokol URL tidak didukung.");
  if (url.href.length > 2048) throw new Error("URL terlalu panjang.");
  if (isPrivateIp(url.hostname)) throw new Error("URL mengarah ke jaringan internal.");
  return url;
}

async function safeFetch(url: URL): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    return await fetch(url.href, {
      signal: controller.signal,
      redirect: "error",
      headers: { "User-Agent": "image-to-prompt-bot" },
    });
  } finally { clearTimeout(timer); }
}

async function getImageBase64(imageInput: string): Promise<string> {
  if (imageInput.startsWith("http://") || imageInput.startsWith("https://")) {
    const url = await validateFetchUrl(imageInput);
    const res = await safeFetch(url);
    if (!res.ok) throw new Error("Gagal mengunduh gambar.");
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  }
  return imageInput.replace(/^data:image\/\w+;base64,/, "");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, mimeType, binaryScanResult } = req.body;

    if (!image || !mimeType) {
      return res.status(400).json({ error: "Silakan unggah gambar." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured." });
    }

    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
    const base64Data = await getImageBase64(image);
    const imagePart = { inlineData: { data: base64Data, mimeType } };

    const promptText = `Anda adalah pakar forensik citra digital. Tentukan apakah gambar ini AI atau asli.
Penanda Biner: ${binaryScanResult || "Tidak tersedia"}

Output: JSON dengan percentage (0-100), classification, visualArtifacts, metadataDugaan, saranVerifikasi.`;

    const modelsToTry = ["gemini-3.1-flash-lite"];
    let apiResponse = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      let attempts = 0;
      while (attempts < 2) {
        attempts++;
        try {
          apiResponse = await ai.models.generateContent({
            model: modelName,
            contents: { parts: [imagePart, { text: promptText }] },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  percentage: { type: Type.INTEGER },
                  classification: { type: Type.STRING },
                  visualArtifacts: { type: Type.STRING },
                  metadataDugaan: { type: Type.STRING },
                  saranVerifikasi: { type: Type.STRING }
                },
                required: ["percentage", "classification", "visualArtifacts", "metadataDugaan", "saranVerifikasi"]
              }
            }
          });
          if (apiResponse?.text) break;
        } catch (err: any) {
          lastError = err;
          if (attempts < 2) await new Promise(r => setTimeout(r, 1500));
        }
      }
      if (apiResponse?.text) break;
    }

    if (!apiResponse?.text) {
      throw new Error(lastError?.message || "Semua model AI sedang mengalami beban tinggi.");
    }

    const payload = JSON.parse(apiResponse.text.trim());
    return res.status(200).json({ success: true, data: payload });

  } catch (error: any) {
    console.error("Detection Error:", error);
    const msg = error?.code === "ECONNREFUSED" || error?.code === "ENOTFOUND"
      ? "Layanan sedang tidak tersedia."
      : error?.name === "AbortError"
        ? "Permintaan timeout."
        : error?.status === 429
          ? "Terlalu banyak permintaan."
          : "Terjadi kesalahan internal.";
    return res.status(500).json({ error: msg });
  }
}
