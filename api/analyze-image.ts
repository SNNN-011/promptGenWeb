import type { VercelRequest, VercelResponse } from "@vercel/node";

// Inline security utilities to avoid import resolution issues
import { GoogleGenAI, Type } from "@google/genai";
import { isIP } from "net";

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

// ---- Input Sanitization ----
const ALLOWED_GENERATORS = ["midjourney", "dalle", "stable-diffusion", "nano-banana", "flux", "ideogram"];
const ALLOWED_ASPECTS = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"];
const ALLOWED_DETAIL = ["compact", "balanced", "detailed"];
const ALLOWED_STYLES = [
  "keep-original", "cyberpunk", "classic-oil-painting", "retro-anime",
  "cinematic-drama", "watercolor", "pixel-art", "minimalist", "surrealism",
  "pop-art", "impressionism", "gothic", "vaporwave", "synthwave",
];

function stripPromptInjection(text: string): string {
  return text
    .replace(/\n/g, " ")
    .replace(/[<>{}]/g, "")
    .replace(/ignore.*previous/gi, "")
    .replace(/system.*prompt/gi, "")
    .replace(/you are now/gi, "")
    .replace(/forget.*instructions/gi, "")
    .replace(/override.*system/gi, "")
    .replace(/\{\{.*?\}\}/g, "")
    .trim();
}

function validateEnum(value: string, allowed: string[], fallback: string): string {
  const v = value?.toLowerCase().trim();
  return allowed.includes(v) ? v : fallback;
}

function sanitizePreferences(prefs: any): any {
  if (!prefs) return null;
  return {
    generator: validateEnum(prefs.generator, ALLOWED_GENERATORS, "nano-banana"),
    aspectRatio: validateEnum(prefs.aspectRatio, ALLOWED_ASPECTS, "1:1"),
    artisticStyle: validateEnum(prefs.artisticStyle, ALLOWED_STYLES, "keep-original"),
    detailLevel: validateEnum(prefs.detailLevel, ALLOWED_DETAIL, "balanced"),
    customInstructions: prefs.customInstructions ? stripPromptInjection(prefs.customInstructions).slice(0, 500) : "",
    aspectToExtract: Array.isArray(prefs.aspectToExtract)
      ? prefs.aspectToExtract.filter((a: string) =>
          ["semua", "warna", "subjek", "gaya", "komposisi", "pencahayaan"].includes(a)
        )
      : ["semua"],
  };
}

// ---- Image Processing ----
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

// ---- Handler ----
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, mimeType, preferences } = req.body;

    if (!image || !mimeType) {
      return res.status(400).json({ error: "Silakan unggah gambar terlebih dahulu." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured." });
    }

    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
    const safePreferences = sanitizePreferences(preferences);
    const base64Data = await getImageBase64(image);
    const imagePart = { inlineData: { data: base64Data, mimeType } };

    let prefsText = "";
    if (safePreferences) {
      prefsText = `The user has specified the following customization preferences:
- Desired Generator: ${safePreferences.generator}
- Desired Aspect Ratio: ${safePreferences.aspectRatio}
- Artistic Vibe or Style: ${safePreferences.artisticStyle}
- Prompt Length/Detail Level: ${safePreferences.detailLevel}
- Custom Request Notes: ${safePreferences.customInstructions ? `"${safePreferences.customInstructions}"` : "None"}`;
    }

    const aspectToExtract = safePreferences?.aspectToExtract || ["semua"];
    let aspectFocusText = "FOKUS ANALISIS UTAMA: **Seluruh Pembentuk Gambar (General Comprehensive Analysis)**.";
    let promptUniversalConstraint = "Prompt wajib hiper-deskriptif dengan sentuhan estetis, pencahayaan sinematis, parameter kamera, dan warna dominan.";

    if (aspectToExtract.length > 0 && !aspectToExtract.includes("semua")) {
      aspectFocusText = "FOKUS ANALISIS PADA:\n" +
        aspectToExtract.map((a: string) => {
          const m: Record<string, string> = { warna: "- Color Grading", subjek: "- Subjek & Pose", gaya: "- Gaya Seni", komposisi: "- Komposisi Kamera", pencahayaan: "- Pencahayaan" };
          return m[a] || "";
        }).filter(Boolean).join("\n");
      promptUniversalConstraint = "Gunakan HANYA elemen yang dipilih.";
    }

    const promptText = `Anda adalah pakar prompt engineering untuk AI generator gambar.
${aspectFocusText}
${prefsText}
${promptUniversalConstraint}

Output: promptUniversal dalam Bahasa Inggris + '--ar ${safePreferences?.aspectRatio || "1:1"}'.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            style: { type: Type.STRING },
            composition: { type: Type.STRING },
            lighting: { type: Type.STRING },
            colors: { type: Type.STRING },
            promptUniversal: { type: Type.STRING },
            additionalTips: { type: Type.STRING },
          },
          required: ["subject", "style", "composition", "lighting", "colors", "promptUniversal", "additionalTips"]
        }
      }
    });

    if (!response?.text) throw new Error("Gagal mendapatkan respons dari model AI.");

    const payload = JSON.parse(response.text.trim());
    return res.status(200).json({ success: true, data: payload });

  } catch (error: any) {
    console.error("Analysis Error:", error);
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
