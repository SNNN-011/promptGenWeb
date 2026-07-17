import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";
import { sanitizePreferences } from "../utils/sanitize";
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
    const { image, mimeType, preferences } = req.body;

    if (!image || !mimeType) {
      return res.status(400).json({ error: "Silakan unggah gambar terlebih dahulu." });
    }

    const safePreferences = sanitizePreferences(preferences);
    const base64Data = await getImageBase64(image);
    const imagePart = { inlineData: { data: base64Data, mimeType } };

    // Build prompt text (same logic as server.ts)
    let prefsText = "";
    if (safePreferences) {
      prefsText = `
The user has specified the following customization preferences for the prompt generation:
- Desired Generator: ${safePreferences.generator}
- Desired Aspect Ratio: ${safePreferences.aspectRatio}
- Artistic Vibe or Style: ${safePreferences.artisticStyle}
- Prompt Length/Detail Level: ${safePreferences.detailLevel}
- Custom Request Notes: ${safePreferences.customInstructions ? `"${safePreferences.customInstructions}"` : "None"}
`;
    }

    const aspectToExtract = safePreferences?.aspectToExtract || ["semua"];
    let aspectFocusText = "";
    let promptUniversalConstraint = "";

    if (aspectToExtract.includes("semua") || aspectToExtract.length === 0) {
      aspectFocusText = `FOKUS ANALISIS: **Seluruh Pembentuk Gambar**.`;
      promptUniversalConstraint = "Prompt wajib hiper-deskriptif dengan sentuhan estetis, pencahayaan sinematis, parameter kamera, dan warna dominan.";
    } else {
      aspectFocusText = "FOKUS ANALISIS PADA:\n";
      if (aspectToExtract.includes("warna")) aspectFocusText += "- Color Grading\n";
      if (aspectToExtract.includes("subjek")) aspectFocusText += "- Subjek & Pose\n";
      if (aspectToExtract.includes("gaya")) aspectFocusText += "- Gaya Seni\n";
      if (aspectToExtract.includes("komposisi")) aspectFocusText += "- Komposisi Kamera\n";
      if (aspectToExtract.includes("pencahayaan")) aspectFocusText += "- Pencahayaan\n";
      promptUniversalConstraint = "Gunakan HANYA elemen yang dipilih.";
    }

    const promptText = `Anda adalah pakar prompt engineering untuk AI generator.
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
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
