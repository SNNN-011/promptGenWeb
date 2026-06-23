import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit to handle base64 image strings
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is missing. Please set your Gemini key in AI Studio under Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API endpoint for image-to-prompt analysis
async function getImageBase64(imageInput: string): Promise<string> {
  if (imageInput.startsWith("http://") || imageInput.startsWith("https://")) {
    const res = await fetch(imageInput);
    if (!res.ok) {
      throw new Error(`Gagal mengunduh gambar contoh dari bursa URL: ${imageInput}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString("base64");
  }
  // Remove data-URL prefix if present
  return imageInput.replace(/^data:image\/\w+;base64,/, "");
}

app.post("/api/analyze-image", async (req, res) => {
  try {
    const { image, mimeType, preferences } = req.body;

    if (!image || !mimeType) {
      return res.status(400).json({ error: "Silakan unggah gambar terlebih dahulu." });
    }

    const ai = getGeminiClient();

    // Fetch or convert to base64
    const base64Data = await getImageBase64(image);
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    // Construct preference tuning rules
    let prefsText = "";
    if (preferences) {
      prefsText = `
The user has specified the following customization preferences for the prompt generation, please adapt the generated prompts to incorporate these styling preferences:
- Desired Generator: ${preferences.generator} (Focus prompts for this model specifically, while keeping others valid too)
- Desired Aspect Ratio: ${preferences.aspectRatio} (Include appropriate aspect ratio parameters, e.g. '--ar ${preferences.aspectRatio}' for Midjourney prompts)
- Artistic Vibe or Style Style: ${preferences.artisticStyle} (E.g. "Keep original", "Cyberpunk", "Classic Oil Painting", "Retro Anime", "Cinematic Drama", etc.)
- Prompt Length/Detail Level: ${preferences.detailLevel} (compact, balanced, or highly-detailed)
- Custom Request Notes: ${preferences.customInstructions ? `"${preferences.customInstructions}"` : "None"}
`;
    }

    let aspectFocusText = "";
    const aspectToExtract = preferences?.aspectToExtract || ["semua"];
    let promptUniversalConstraint = "";

    if (aspectToExtract.includes("semua") || aspectToExtract.length === 0) {
      aspectFocusText = `
FOKUS ANALISIS UTAMA ANDA ADALAH: **Seluruh Pembentuk Gambar (General Comprehensive Analysis)**.
- Lakukan pembedahan visual secara menyeluruh dan seimbang meliputi subjek, gaya seni, komposisi kamera, pencahayaan, dan gaya palet warna secara seimbang.`;
      
      promptUniversalConstraint = "Prompt Nano Banana wajib sangat khas, hiper-deskriptif, dan memasukkan sentuhan gaya estetis (gaya artistik terpilih), detail elemen pencahayaan yang sinematis, parameter kamera/lensa, warna dominan, serta mengoptimalkannya untuk Nano Banana engine.";
    } else {
      aspectFocusText = "FOKUS ANALISIS UTAMA ANDA ADALAH PADA ASPEK-ASPEK TERPILIH BERIKUT:\n";
      const selectedAspectNames: string[] = [];
      if (aspectToExtract.includes("warna")) {
        aspectFocusText += `\n- **Color Grading & Skema Warna Gambar (Color Palette Focus)**: Analisis secara saksama setiap rona warna, tingkat temperatur warna (cool/warm tones), saturasi, kontras, serta gaya color-grading (misalnya: film-look matted, saturated cyberpunk neon, earthy pastel, moody dark, dual-tone split-toning). Formulasikan gaya warna ini secara ultra-detail pada prompt bahasa Inggris Anda.`;
        selectedAspectNames.push("color grading/skema warna");
      }
      if (aspectToExtract.includes("subjek")) {
        aspectFocusText += `\n- **Subjek, Objek, Karakter, & Pose (Subject & Pose Focus)**: Analisis secara saksama letak objek utama, gerak-gerik karakter, pose tubuh, pakaian, raut wajah, serta interaksi antar subjek di dalam frame. Konstruksikan rupa karakter ini sedetail mungkin agar disalin presisi oleh AI generator.`;
      selectedAspectNames.push("deskripsi subjek/objek/karakter dan pose");
      }
      if (aspectToExtract.includes("gaya")) {
        aspectFocusText += `\n- **Gaya Seni, Kualitas Estetika, & Medium Seni (Art Style & Medium Focus)**: Deskripsikan secara mendalam bagaimana karya seni ini diciptakan (apakah lukisan cat minyak impasto berserat kasar, ilustrasi vector halus, digital anime 90an, render 3D Octane mengkilap, dll) agar bisa dipicu meniru tekstur gaya cetak tersebut.`;
      selectedAspectNames.push("gaya seni/medium seni")
      }
      if (aspectToExtract.includes("komposisi")) {
        aspectFocusText += `\n- **Lensa, Sudut Pandang, & Komposisi Kamera (Camera Lens & Composition Focus)**: Analisis pembingkaian foto (misal macro closeup, low-angle shot, rule of thirds, overhead top-down, panoramic, dsb). Tentukan depth of field yang sesuai serta parameter lensa profesional.`;
      selectedAspectNames.push("komposisi/sudut pandang kamera/lensa");
      }
      if (aspectToExtract.includes("pencahayaan")) {
        aspectFocusText += `\n- **Pencahayaan & Atmosfer Suasana (Lighting & Moody Atmosphere Focus)**: Identifikasi arah datangnya sinar cahaya (rim lighting, volumetric rays, soft window diffusions, dramatic chiaroscuro shadow play, neon glow, golden hour) dan formulasikan suasana bayangan-pendaran tersebut.`;
      selectedAspectNames.push("pencahayaan/atmosfer");
      }
      promptUniversalConstraint = `PENTING: Karena user hanya memilih prioritas tertentu, maka teks prompt untuk kolom "promptUniversal" HANYA boleh berisi gabungan dari elemen-elemen prioritas berikut saja: [${selectedAspectNames.join(", ")}], dan tidak boleh memasukkan elemen di luar prioritas tersebut. Gabungkan hasil ekstraksi prioritas tersebut sealami mungkin.`;
    }

    const promptText = `Anda adalah pakar teknik prompt (Prompt Engineering Expert) untuk generator seni AI eksklusif "Nano Banana". 
Tugas Anda adalah menganalisis gambar terlampir secara mendalam  gambar tersebut menjadi prompt teks penghasil gambar yang sangat akurat yang dioptimalkan khusus untuk engine Nano Banana sesuai keinginan user.

${aspectFocusText}

Lakukan pembedahan aspek detail berikut secara menyeluruh (selalu isi semua kolom deskripsi ini, namun berikan penekanan berlipat ganda pada aspek fokus analisis yang dipilih di atas):
1. Subjek Utama: Apa yang sedang terjadi, karakter, pose, ekspresi, pakaian, dan penempatan objek di dalam bingkai.
2. Gaya Seni: Apakah itu foto realistis, ilustrasi 3D, cat minyak, retro anime, render 3D, dst.
3. Komposisi Kamera: Depth of field, focal length (misal 50mm), sudut kamera (low angle, eye level), jenis bidikan.
4. Pencahayaan & Atmosfer: Waktu (golden hour, malam), intensitas (rim light, moody shadows), asupan emosi.
5. Palet Warna: Warna dominan, kontras, saturasi (monokrom, pastel, neon).

${prefsText}

Instruksi Output Prompt:
- promptUniversal: Buat prompt gambar Nano Banana beresolusi tinggi dalam bahasa Inggris (English). ${promptUniversalConstraint} Selipkan format rasio aspek '--ar ${preferences?.aspectRatio || "1:1"}' di bagian paling akhir prompt.

Bahasa:
- Tulis penjelasan subjek (subject), gaya seni (style), komposisi (composition), pencahayaan (lighting), warna (colors), dan saran tambahan (additionalTips) dalam Bahasa Indonesia yang formal.
- Namun, kolom prompt hasil akhir (promptUniversal) WAJIB ditulis dalam Bahasa Inggris secara lengkap karena generator gambar AI Nano Banana memproses Bahasa Inggris dengan ketajaman paling unggul.`;

    const modelsToTry = [
      "gemini-3.1-flash-lite"
    ];

    let response = null;
    let lastError = null;

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (const modelName of modelsToTry) {
      let attempts = 0;
      const maxAttempts = 2;
      
      while (attempts < maxAttempts) {
        attempts++;
        try {
          console.log(`Mencoba analisis menggunakan model: ${modelName} (Percobaan ${attempts}/${maxAttempts})`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [imagePart, { text: promptText }]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING, description: "Deskripsi rinci tentang subjek utama atau aktivitas dalam Bahasa Indonesia." },
                  style: { type: Type.STRING, description: "Deskripsi rinci tentang gaya seni gambar dalam Bahasa Indonesia." },
                  composition: { type: Type.STRING, description: "Deskripsi rinci mengenai sudut pandang kamera, pembingkaian frame, dan kedalaman lensa dalam Bahasa Indonesia." },
                  lighting: { type: Type.STRING, description: "Deskripsi rinci tentang pencahayaan dan atmosfer emosional dalam Bahasa Indonesia." },
                  colors: { type: Type.STRING, description: "Analisis tentang color grading dan gradasi warna dalam Bahasa Indonesia." },
                  promptUniversal: { type: Type.STRING, description: "Prompt gambar universal dalam Bahasa Inggris dengan rasio aspek di ujungnya." },
                  additionalTips: { type: Type.STRING, description: "Tips dan panduan pro dalam Bahasa Indonesia agar hasil gambar maksimal." },
                },
                required: [
                  "subject", "style", "composition", "lighting", "colors",
                  "promptUniversal", "additionalTips"
                ]
              }
            }
          });

          if (response && response.text) {
            break; // Berhasil!
          }
        } catch (err: any) {
          console.warn(`Gagal menggunakan model ${modelName} pada percobaan ${attempts}:`, err.message || err);
          lastError = err;
          if (attempts < maxAttempts) {
            console.log("Menunggu 1.5 detik sebelum mencoba lagi...");
            await delay(1500);
          }
        }
      }
      
      if (response && response.text) {
        break; // Keluar dari loop model jika berhasil
      }
    }

    if (!response || !response.text) {
      throw new Error(
        lastError?.message || "Semua model AI sedang mengalami beban tinggi atau gangguan sementara. Silakan coba lagi nanti."
      );
    }

    const payload = JSON.parse(response.text.trim());
    return res.json({ success: true, data: payload });

  } catch (error: any) {
    console.error("Analysis Error Details:", error);
    return res.status(500).json({ error: error.message || "Gagal mengurai gambar visual ke bentuk prompt." });
  }
});

app.post("/api/detect-ai", async (req, res) => {
  try {
    const { image, mimeType } = req.body;

    if (!image || !mimeType) {
      return res.status(400).json({ error: "Silakan unggah gambar terlebih dahulu." });
    }

    const ai = getGeminiClient();
    const base64Data = await getImageBase64(image);
    const buffer = Buffer.from(base64Data, "base64");

    const occurrences: string[] = [];
    const bufferStr = buffer.toString("utf-8");
    if (bufferStr.includes("C2PA") || bufferStr.includes("c2pa") || bufferStr.includes("JUMBF")) {
      occurrences.push("Content Credentials (C2PA / JUMBF) marker terdeteksi");
    }
    if (bufferStr.includes("synthid") || bufferStr.includes("SynthID") || bufferStr.includes("Synthid")) {
      occurrences.push("Indikasi tanda air digital Google SynthID teridentifikasi");
    }
    if (bufferStr.includes("Adobe Firefly") || bufferStr.includes("Adobe") || bufferStr.includes("photoshop")) {
      occurrences.push("Penanda perangkat lunak Adobe Creative Suite / Firefly terbaca");
    }
    if (bufferStr.includes("Midjourney") || bufferStr.includes("midjourney") || bufferStr.includes("mj-dec")) {
      occurrences.push("Metadata khas generator AI Midjourney terdeteksi");
    }
    if (bufferStr.includes("DALL-E") || bufferStr.includes("dalle") || bufferStr.includes("OpenAI")) {
      occurrences.push("Metadata generator AI OpenAI DALL-E terdeteksi");
    }
    if (bufferStr.includes("Stable Diffusion") || bufferStr.includes("stable-diffusion") || bufferStr.includes("sdxl")) {
      occurrences.push("Metadata generator AI Stable Diffusion terdeteksi");
    }

    const binaryScanResult = occurrences.length > 0 
      ? occurrences.join(", ") 
      : "Tidak ditemukan tanda pengenal biner eksplisit (C2PA/SynthID bersih atau ditimpa/dikompres ulang)";

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    const promptText = `Anda adalah pakar forensik citra digital terkemuka di dunia. Tugas Anda adalah melakukan analisis mendalam mengenai autentisitas gambar ini untuk menentukan apakah gambar ini dihasilkan oleh AI (Sintetis) atau merupakan foto/karya seni manual asli yang diambil menggunakan kamera/secara fisik.

Hasil pemindaian biner gambar menghasilkan analisis penanda berikut:
- Penanda Biner / Metadata: ${binaryScanResult}

Instruksi Analisis:
1. Menganalisis anomali visual: Periksa distorsi anatomi, inkonsistensi bayangan/komparasi cahaya, peleburan tekstur berulang pada wilayah latar belakang, kemiripan filter difusi, dll.
2. Menganalisis Metadata: Tarik korelasi antara penanda biner di atas (seperti SynthID, C2PA Content Credentials, dsb) dengan kejanggalan visual yang Anda lihat.
3. Berikan penilaian akhir berupa persentase indikator probabilitas buatan AI (0% hingga 100%), klasifikasi, analisis artefak visual, dugaan metadata, serta saran verifikasi tambahan.

PENTING: Seluruh tanggapan WAJIB ditulis dalam Bahasa Indonesia yang profesional dan formal. Jangan menyertakan komentar ornamen sistem apapun di luar skema JSON yang diminta.`;

    const modelsToTry = [
      "gemini-3.1-flash-lite"
    ];

    let apiResponse = null;
    let lastError = null;

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (const modelName of modelsToTry) {
      let attempts = 0;
      const maxAttempts = 2;
      
      while (attempts < maxAttempts) {
        attempts++;
        try {
          console.log(`Mencoba deteksi menggunakan model: ${modelName} (Percobaan ${attempts}/${maxAttempts})`);
          apiResponse = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [imagePart, { text: promptText }]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  percentage: { type: Type.INTEGER, description: "Persentase kecurigaan AI (nilai integer dari 0 sampai 100)." },
                  classification: { type: Type.STRING, description: "Klasifikasi akhir produk gambar, misalnya 'Sintetis / Hasil Generate AI', 'Asli / Foto Kamera', atau 'Dicurigai Modifikasi AI'." },
                  visualArtifacts: { type: Type.STRING, description: "Penjelasan mendalam mengenai temuan keganjilan/artefak visual atau elemen naturalitas gambar." },
                  metadataDugaan: { type: Type.STRING, description: "Ulasan dugaan metadata dan pencocokan riwayat digital (C2PA, SynthID, EXIF, dsb) dalam Bahasa Indonesia." },
                  saranVerifikasi: { type: Type.STRING, description: "Langkah-langkah tambahan taktis mandiri untuk membuktikannya dalam Bahasa Indonesia." }
                },
                required: ["percentage", "classification", "visualArtifacts", "metadataDugaan", "saranVerifikasi"]
              }
            }
          });

          if (apiResponse && apiResponse.text) {
            break;
          }
        } catch (err: any) {
          console.warn(`Gagal menggunakan model ${modelName} pada percobaan ${attempts}:`, err.message || err);
          lastError = err;
          if (attempts < maxAttempts) {
            await delay(1500);
          }
        }
      }
      
      if (apiResponse && apiResponse.text) {
        break;
      }
    }

    if (!apiResponse || !apiResponse.text) {
      throw new Error(
        lastError?.message || "Semua model AI sedang mengalami beban tinggi atau gangguan sementara. Silakan coba lagi nanti."
      );
    }

    const payload = JSON.parse(apiResponse.text.trim());
    return res.json({ success: true, data: payload });

  } catch (error: any) {
    console.error("Detection Error Details:", error);
    return res.status(500).json({ error: error.message || "Gagal melakukan deteksi keaslian gambar." });
  }
});

// Setup server integration with Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on URL http://0.0.0.0:${PORT}`);
  });
}

startServer();
