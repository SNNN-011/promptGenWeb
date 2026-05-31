export function getPromptTemplate(preferences: any): string {
  const prefsText = preferences
    ? `
The user has specified the following customization preferences:
- Desired Generator: ${preferences.generator}
- Desired Aspect Ratio: ${preferences.aspectRatio}
- Artistic Vibe or Style: ${preferences.artisticStyle}
- Prompt Length/Detail Level: ${preferences.detailLevel}
- Custom Request Notes: ${preferences.customInstructions ? `"${preferences.customInstructions}"` : "None"}
`
    : "";

  const aspectToExtract = preferences?.aspectToExtract || ["semua"];
  let aspectFocusText = "";
  let promptUniversalConstraint = "";

  if (aspectToExtract.includes("semua") || aspectToExtract.length === 0) {
    aspectFocusText = `FOKUS ANALISIS UTAMA ANDA ADALAH: **Seluruh Pembentuk Gambar (General Comprehensive Analysis)**.`;
    promptUniversalConstraint = "Prompt Nano Banana wajib sangat khas, hiper-deskriptif, dan memasukkan sentuhan gaya estetis, detail elemen pencahayaan, parameter kamera, dan warna dominan.";
  } else {
    aspectFocusText = "FOKUS ANALISIS UTAMA ANDA ADALAH PADA ASPEK-ASPEK TERPILIH:\n";
    const selectedAspectNames: string[] = [];
    if (aspectToExtract.includes("warna")) {
      aspectFocusText += "- Color Grading & Skema Warna\n";
      selectedAspectNames.push("color grading/skema warna");
    }
    if (aspectToExtract.includes("subjek")) {
      aspectFocusText += "- Subjek, Objek, Karakter, & Pose\n";
      selectedAspectNames.push("deskripsi subjek/objek/karakter dan pose");
    }
    if (aspectToExtract.includes("gaya")) {
      aspectFocusText += "- Gaya Seni & Medium Seni\n";
      selectedAspectNames.push("gaya seni/medium seni");
    }
    if (aspectToExtract.includes("komposisi")) {
      aspectFocusText += "- Lensa, Sudut Pandang, & Komposisi Kamera\n";
      selectedAspectNames.push("komposisi/sudut pandang kamera/lensa");
    }
    if (aspectToExtract.includes("pencahayaan")) {
      aspectFocusText += "- Pencahayaan & Atmosfer\n";
      selectedAspectNames.push("pencahayaan/atmosfer");
    }
    promptUniversalConstraint = `PENTING: Gunakan HANYA elemen berikut: [${selectedAspectNames.join(", ")}].`;
  }

  return `Anda adalah pakar teknik prompt (Prompt Engineering Expert) untuk generator seni AI "Nano Banana". 
Analisis gambar ini secara mendalam untuk hasil yang optimal.

${aspectFocusText}

Pembedahan aspek detail:
1. Subjek Utama: Karakter, pose, ekspresi, pakaian.
2. Gaya Seni: Foto realistis, ilustrasi 3D, cat minyak, dst.
3. Komposisi Kamera: Depth of field, focal length, sudut kamera.
4. Pencahayaan & Atmosfer: Waktu, intensitas, suasana.
5. Palet Warna: Warna dominan, kontras, saturasi.

${prefsText}

Instruksi Output:
- promptUniversal: Prompt Inggris hi-res. ${promptUniversalConstraint} Tambahkan '--ar ${preferences?.aspectRatio || "1:1"}' di akhir.
- Bahasa: Penjelasan (subjek, gaya, komposisi, dll) dalam Bahasa Indonesia Formal. promptUniversal WAJIB dalam Bahasa Inggris.`;
}
