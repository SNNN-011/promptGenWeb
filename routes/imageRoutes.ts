import express from "express";
import { Type } from "@google/genai";
import { AnalysisRequest, AnalysisResponse } from "../types";
import { getGeminiClient, constructPrompt } from "../services/geminiService";
import logger from "../utils/logger";
import { validateFetchUrl, safeFetch } from "../utils/security";
import { sanitizeError } from "../utils/errors";

const router = express.Router();

async function getImageBase64(imageInput: string): Promise<string> {
  if (imageInput.startsWith("http://") || imageInput.startsWith("https://")) {
    try {
      const url = await validateFetchUrl(imageInput); // SSRF protection
      const res = await safeFetch(url);
      if (!res.ok) {
        throw new Error("Gagal mengunduh gambar.");
      }
      
      const contentLength = res.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
        throw new Error("Ukuran gambar terlalu besar (max 5MB).");
      }

      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer).toString("base64");
    } catch (err: any) {
      throw new Error("Gagal memproses gambar dari URL.");
    }
  }
  return imageInput.replace(/^data:image\/\w+;base64,/, "");
}

router.post("/analyze-image", async (req: express.Request<{}, {}, AnalysisRequest>, res: express.Response<{ success: boolean; data: AnalysisResponse }>) => {
  try {
    const { image, mimeType, preferences } = req.body;

    if (!image || !mimeType) {
      return res.status(400).json({ error: "Silakan unggah gambar terlebih dahulu." });
    }

    const ai = getGeminiClient();
    const base64Data = await getImageBase64(image);
    logger.info("Memulai analisis gambar...");
    
    const promptText = constructPrompt(preferences);

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: {
        parts: [{ inlineData: { data: base64Data, mimeType } }, { text: promptText }]
      },
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

    if (!response || !response.text) {
      throw new Error("Gagal mendapatkan respons dari model AI.");
    }

    const payload = JSON.parse(response.text.trim());
    return res.json({ success: true, data: payload });

  } catch (error: any) {
    logger.error("Analysis Error:", { error: error.message });
    return res.status(500).json({ error: sanitizeError(error) });
  }
});

export default router;
