import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";
import { validateFetchUrl, safeFetch } from "../utils/security";
import { sanitizeError } from "../utils/errors";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: { headers: { "User-Agent": "aistudio-build" } },
});

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
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
