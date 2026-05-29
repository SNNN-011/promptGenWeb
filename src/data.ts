import { ImageAnalysisResponse } from "./types";

export interface SampleImage {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  originalStyle: string;
  precalculatedResponse: ImageAnalysisResponse;
}

export const PRESET_MODELS = [
  { id: "all", label: "Semua Model AI", desc: "Dapatkan prompt DALL-E, Midjourney, dan Stable Diffusion sekaligus" },
  { id: "midjourney", label: "Midjourney v6", desc: "Fokus pada struktur estetika, realisme sinematik, dan parameter spesifik" },
  { id: "dalle", label: "DALL-E 3 (ChatGPT)", desc: "Fokus pada instruksi bahasa alami yang deskriptif dan kaya imajinasi" },
  { id: "sd", label: "Stable Diffusion XL", desc: "Fokus pada tag teknis, material detail, dan penyaringan saringan negatif" }
] as const;

export const PRESET_RATIOS = [
  { id: "1:1", label: "1:1 Kotak", desc: "Standar Instagram/Avatar" },
  { id: "16:9", label: "16:9 Sinematik", desc: "Layar Lebar / Wallpaper Desktop" },
  { id: "9:16", label: "9:16 Potret", desc: "TikTok / Story Smartphone" },
  { id: "4:3", label: "4:3 Klasik", desc: "Format Foto Tradisional" },
  { id: "3:4", label: "3:4 Potret Tinggi", desc: "Seni Poster / Portofolio" }
] as const;

export const PRESET_STYLES = [
  { id: "original", label: "Pertahankan Gaya Asli", value: "Keep original styling vibes" },
  { id: "photorealism", label: "Fotorealistik Ultra", value: "High-end cinematic photography, photorealistic, captured on 35mm lens, hyper-detail" },
  { id: "anime", label: "Retro Anime Studio Ghibli", value: "Vintage 1990s anime hand-drawn style, nostalgic Studio Ghibli aesthetic, soft cel-shading" },
  { id: "cyberpunk", label: "Cyberpunk Futuristik", value: "Futuristic cyberpunk aesthetic, neon-drenched city rain, high-tech holographic overlays" },
  { id: "oilpaint", label: "Lukisan Cat Minyak", value: "Classic thick impasto oil painting, visible canvas texture, masterpiece brushstrokes" },
  { id: "claymation", label: "Seni 3D Clay / Claymation", value: "Cute claymation 3D clay model, stop-motion plasticine aesthetic, charming handcrafted texture" },
  { id: "watercolor", label: "Seni Lukis Air / Watercolor", value: "Dreamy ethereal watercolor painting, soft paint splashes, elegant wet-on-wet washes" },
  { id: "steampunk", label: "Victorian Steampunk", value: "Retro steampunk style, brass gears, copper steam pipes, victorian industrial retro-futurism" }
] as const;

export const PRESET_DETAILS = [
  { id: "compact", label: "Padat & Ringkas", desc: "Hanya elemen inti yang paling penting" },
  { id: "balanced", label: "Seimbang (Rekomendasi)", desc: "Komposisi dan gaya dijelaskan proporsional" },
  { id: "highly-detailed", label: "Sangat Detail & Mewah", desc: "Kaya akan penjelas material, lensa, & atmosfer mikro" }
] as const;

export const PRESET_ASPECT_EXTRACT = [
  { id: "semua", label: "Seluruh Elemen Gambar ⭐", desc: "Menganalisis seluruh pembentuk gambar: subjek, gaya seni, lighting, kamera, & warna." },
  { id: "warna", label: "Color Grading & Warna 🎨", desc: "Fokus mengekstrak palet warna, temperatur, saturasi, dan nuansa color-grading." },
  { id: "subjek", label: "Subjek, Objek & Pose 👤", desc: "Fokus menangkap bentuk karakter, detail pakaian, pose unik, dan fokus sentral." },
  { id: "gaya", label: "Gaya Seni & Medium 🎭", desc: "Fokus mengurai medium pencipta (cat minyak, ilustrasi vektor, anime, 3D Octane render)." },
  { id: "komposisi", label: "Lensa & Sudut Kamera 📹", desc: "Fokus mendikte kedalaman lensa (DoF), kemiringan sudut (tilt/low-angle), dan rules-of-thirds." },
  { id: "pencahayaan", label: "Cahaya & Atmosfer 💡", desc: "Fokus membedah distribusi cahaya, pendar bayangan, rim-light, dan suasana batin (mood)." }
] as const;

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: "galaxy-astronaut",
    title: "Astronot & Refleksi Kosmik",
    category: "Sci-Fi / Fotografi",
    imageUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&q=80&w=600",
    originalStyle: "Fotorealistik Eksploratif luar angkasa dengan pencahayaan kosmik biru-oranye dramatis.",
    precalculatedResponse: {
      subject: "Seorang astronot yang berdiri dalam balutan pakaian ruang angkasa lengkap EVA (Extravehicular Activity) berwarna putih dengan helm berkilau yang memantulkan pemandangan bumi dan nebula bintang yang indah. Astronot dipotret setengah badan, menghadap ke samping kamera.",
      style: "Fotografi luar angkasa sinematik beresolusi tinggi, bernuansa megah dan penuh keheningan kosmis.",
      composition: "Bidikan sedang (medium shot), diambil dengan kamera fiktif bersensor medium format, dengan depth of field yang dangkal sehingga latar belakang kosmos tampak buram secara halus (bokeh artistik).",
      lighting: "Pencahayaan ganda dramatis (dual-tone split lighting) yang memancarkan pendar oranye hangat bintang di satu sisi, dan pantulan biru neon dingin dari planet bumi di sisi lainnya.",
      colors: "Warna kontras tinggi antara kelamnya luar akasa dengan jingga kosmik yang membara dan biru elektrik bumi, menciptakan kontras visual pelengkap (complementary contrast) yang kuat.",
      promptUniversal: "A cinematic medium-shot photo of an astronaut in an intricate white spacesuit. The gold-tinted glass of their helmet visor clearly reflects Planet Earth and glowing orange stellar nebulae. Intense side lighting from cosmic stars with electric blue and rich orange glows. Epic deep space atmosphere, highly detailed textures, photorealistic masterpiece, widescreen aspect-ratio --ar 16:9",
      additionalTips: "Gunakan pengubah warna oranye dan biru untuk memaksimalkan efek sci-fi futuristik. Pada Midjourney, pastikan menggunakan rasio lebar agar kemegahan luar angkasa lebih membentang epik."
    }
  },
  {
    id: "gothic-cottage",
    title: "Pondok Fantasi di Tengah Hutan",
    category: "Watercolor / Fantasi",
    imageUrl: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=600",
    originalStyle: "Estetika Pondok pedesaan mistis dengan balutan alam magis yang tentram.",
    precalculatedResponse: {
      subject: "Sebuah pondok kayu kuno bertingkat dengan atap runcing berhiaskan lumut hijau lembut. Di luar pondok, terdapat jalan setapak berbatu yang diapit oleh tanaman pakis, rerumputan liar tinggi, dan kabut pagi tipis yang menyelimuti sela-sela pohon pinus besar.",
      style: "Lukisan cat air fantastis bergaya ilustrasi buku dongeng klasik, bernuansa lembut dengan batas-batas warna bergradasi indah.",
      composition: "Sudut pandang mata-sejajar (eye-level view) dengan komposisi sepertiga bidang (rule of thirds), mengondisikan pondok sebagai pusat ketertarikan utama dikelilingi hutan rimbun.",
      lighting: "Pencahayaan fajar yang menembus sela-sela rimbunnya pohon pinus (god rays), menghasilkan kilau keemasan lembut pada kabut hutan yang tenang.",
      colors: "Palet warna yang menenangkan, dipenuhi oleh spektrum hijau lumut, cokelat kayu pinus tua, kelabu batu alam, serta sentuhan kuning keemasan tipis dari sinar mentari pagi.",
      promptUniversal: "An enchanting ethereal watercolor illustration of a whimsical wooden cottage nestled inside a foggy pine forest. A stone pathway leads to the arched wooden door. Light mist rises from the vibrant green ferns. Golden morning sunbeams filter through the towering trees, creating a warm magical glow, fairytale book aesthetic, soft watercolor splashes --ar 4:3",
      additionalTips: "Bila mengunggah ke Stable Diffusion, cobalah tambah tag 'fine paper texture' untuk memberi kesan bahwa gambar benar-benar dilukis di atas kertas watercolor berserat."
    }
  },
  {
    id: "cyberpunk-rain-city",
    title: "Gang Hujan Cyberpunk Tokyo",
    category: "Futuristik / Cyberpunk",
    imageUrl: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&q=80&w=600",
    originalStyle: "Kehidupan malam kota futuristik distopia berhiaskan reklame neon berwarna cerah di bawah guyuran hujan.",
    precalculatedResponse: {
      subject: "Sebuah gang sempit futuristik bergaya neo-Tokyo dengan aspal basah yang memantulkan pantulan cahaya lampu neon berwarna pink magenta dan biru elektrik. Papan reklame hologram melayang di antara gedung bertingkat tinggi dengan kabel-kabel listrik yang bergelantungan tak beraturan.",
      style: "Gaya seni fiksi ilmiah cyberpunk dengan detail mekanis tinggi, nuansa distopia modern, dan render semi-realistik Octane.",
      composition: "Sudut bidik lebar dari bawah (low-angle wide shot) guna menonjolkan ketinggian mega-struktur gedung pencakar langit kota futuristik serta kedalaman gang aspal tersebut.",
      lighting: "Pencahayaan neon malam hari didominasi pendar atmosfer dari lampu latar warna cyber-magenta, cyan, dan biru tua yang menyinari gang.",
      colors: "Warna yang sangat jenuh (highly saturated colors) dengan spektrum utama biru neon, ungu violet, merah menyala, dan kegelapan hitam aspal basah.",
      promptUniversal: "A low-angle wide photo of a narrow futuristic alley in Neo-Tokyo during rainy night. The wet asphalt beautifully reflects the glowing neon signs of hot pink, magenta, and electric blue. Towering skyscrapers with huge glowing hologram advertisements fill the sky, high contrast atmospheric lighting, cybernetic details --ar 16:9",
      additionalTips: "Kata kunci seperti 'wet reflecting asphalt' atau 'neon reflections' sangat krusial di sini agar algoritma AI membuat kilau air hujan pada jalanan tampak sangat nyata."
    }
  },
  {
    id: "neon-sculpture",
    title: "Statua Yunani Neon Art",
    category: "Seni Modern / Vaporwave",
    imageUrl: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&q=80&w=600",
    originalStyle: "Perkawinan estetika patung marmer antik klasik dengan instalasi seni modern bercahaya neon.",
    precalculatedResponse: {
      subject: "Sesosok patung pahatan marmer putih bergaya Yunani kuno klasik yang agung menggambarkan figur dewa Olympian. Patung marmer putih halus yang bertekstur realistis ini dipadukan secara langsung dengan cincin cahaya neon LED fuchsia-pink dan cyan-biru melingkar yang menembus bagian matanya secara abstraktif.",
      style: "Seni instalasi modern bergaya kontemporer, berpadu dengan unsur estetika retro-futurisme Vaporwave dan pencahayaan panggung dramatis.",
      composition: "Bidikan jarak dekat (high-detail closeup portrait) memusatkan bidikan pada bagian kepala patung marmer dengan bayangan bayang-bayang patung yang tegas di latar belakangnya.",
      lighting: "Pencahayaan chiaroscuro kontras tinggi yang bersumber langsung dari pancaran neon berwarna fuchsia cerah dan biru elektrik, memberikan bayangan sudut wajah pahlawan yang kokoh dan berkarakter.",
      colors: "Warna marmer putih pualam natural dibalut gradien warna neon ungu, merah muda bercahaya, dan biru toska di tengah kegelapan pekat latar belakang abu-abu arang.",
      promptUniversal: "A high-fashion museum portrait of an ancient Greek white marble statue head. Abstract glowing neon glass helix in bright magenta and cyan wraps around the eyes and face of the bust. Dark moody gallery studio background, dramatic chiaroscuro high-contrast lighting, vaporwave neo-art aesthetic --ar 3:4",
      additionalTips: "Bila ingin nuansa retro yang lebih kental, padukan prompt ini dengan tag 'Vaporwave aesthetic' atau 'synthwave palette'."
    }
  }
];
