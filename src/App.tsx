import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  Sparkles, 
  Copy, 
  Check, 
  Upload, 
  RefreshCw, 
  Image as ImageIcon, 
  Eye,
  Palette,
  Compass,
  Lightbulb,
  Cpu,
  Monitor,
  Heart,
  AlertCircle,
  X,
  Sliders,
  Sparkle
} from "lucide-react";
import { SAMPLE_IMAGES, PRESET_RATIOS, PRESET_STYLES, PRESET_DETAILS, PRESET_ASPECT_EXTRACT } from "./data";
import { ImageAnalysisResponse } from "./types";

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(SAMPLE_IMAGES[0].imageUrl);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  
  const [aspectToExtract, setAspectToExtract] = useState<('semua' | 'subjek' | 'gaya' | 'komposisi' | 'pencahayaan' | 'warna')[]>(["semua"]);
  const [generator] = useState<'all' | 'midjourney' | 'dalle' | 'sd'>("all");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [artisticStyle, setArtisticStyle] = useState<string>("original");
  const [detailLevel, setDetailLevel] = useState<'compact' | 'balanced' | 'highly-detailed'>("balanced");
  const [customInstructions, setCustomInstructions] = useState<string>("");

  const handleToggleAspect = (id: 'semua' | 'subjek' | 'gaya' | 'komposisi' | 'pencahayaan' | 'warna') => {
    if (id === "semua") {
      setAspectToExtract(["semua"]);
    } else {
      let next = aspectToExtract.filter(x => x !== "semua");
      if (next.includes(id)) {
        next = next.filter(x => x !== id);
      } else {
        next.push(id);
      }
      if (next.length === 0) {
        setAspectToExtract(["semua"]);
      } else {
        setAspectToExtract(next);
      }
    }
  };

  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResponse | null>(SAMPLE_IMAGES[0].precalculatedResponse);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const progressSteps = [
    "Menghubungkan Gemini Engine...",
    "Scanning piksel visual...",
    "Membedah subjek & mood...",
    "Mengekstrak gaya artistik...",
    "Memformulasikan prompt draf...",
    "Menghaluskan rasio aspek..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < progressSteps.length - 1 ? prev + 1 : prev));
      }, 1000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Format file harus berupa gambar.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran gambar maksimal adalah 10 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setMimeType(file.type);
      setAnalysisResult(null);
      setError(null);
    };
    reader.onerror = () => {
      setError("Gagal membaca gambar.");
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof SAMPLE_IMAGES[number]) => {
    setSelectedImage(sample.imageUrl);
    setMimeType("image/jpeg");
    setAnalysisResult(sample.precalculatedResponse);
    setArtisticStyle("original");
    setError(null);
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) {
      setError("Silakan pilih gambar terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const styleObj = PRESET_STYLES.find(s => s.id === artisticStyle);
      const artisticStyleValue = styleObj ? styleObj.value : "Keep original styling vibes";

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image: selectedImage,
          mimeType: mimeType,
          preferences: {
            generator,
            aspectRatio,
            artisticStyle: artisticStyleValue,
            detailLevel,
            customInstructions,
            aspectToExtract
          }
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal memproses analisis gambar.");
      }

      setAnalysisResult(result.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal memproses gambar. Pastikan API key Anda aktif.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [id]: false }));
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-parchment-canvas text-ink flex flex-col relative tracking-tight selection:bg-lavender-chip selection:text-ink">
      
      {/* 1. TOP ANNOUNCEMENT BAR (Superhuman Bracket Frame) */}
      <div id="announcement-frame" className="w-full bg-aubergine text-white text-[11px] font-medium py-2 px-4 flex items-center justify-between border-b border-aubergine-deep shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex bg-white/10 text-white font-mono text-[9px] uppercase px-1.5 py-0.5 rounded tracking-widest">
            ACTIVE SYSTEM
          </span>
          <span className="opacity-90 font-mono tracking-tight">Gemini 3.1 Flash Lite Online Failover Engine</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-white/70">
          <span>Shield Safe Environment</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </div>

      {/* 2. STICKY SYSTEM NAVIGATION */}
      <header className="bg-white/95 backdrop-blur-md border-b border-fog sticky top-0 z-40 px-4 py-3 shrink-0">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-ink flex items-center justify-center text-white relative shadow-sm">
              <Camera className="h-4 w-4" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-iris"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-display font-semibold text-base tracking-tight text-ink">AuraPrompt</span>
                <span className="text-[9px] uppercase font-bold tracking-wider bg-ink text-white px-1 ml-0.5 rounded">PRO</span>
              </div>
              <p className="text-[9px] text-graphite uppercase tracking-wider font-mono mt-0.5">Membongkar Visual Menjadi Kata</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 text-xs text-graphite/80 font-mono border-r border-fog pr-4">
              <span>EST. PROCESSING: ~2s</span>
              <span>&bull;</span>
              <span>MODEL: DALL-E &bull; MIDJOURNEY &bull; SD</span>
            </div>
            <a 
              href="#workspace" 
              className="px-3.5 py-1.5 text-xs font-semibold text-iris border border-iris hover:bg-iris/5 transition-all rounded-lg flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Reset Cabin
            </a>
          </div>
        </div>
      </header>

      {/* 3. HERO GLASS CONTAINER (Atmospheric Spotlights Behind) */}
      <div className="relative overflow-hidden border-b border-fog bg-white py-12 px-4 shadow-[inset_0_-2px_10px_rgba(41,40,39,0.02)]">
        
        {/* Subtle radial gradients behind page top */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-15 overflow-hidden">
          <div className="absolute top-[-50px] left-[15%] w-[400px] h-[400px] rounded-full filter blur-[80px]" style={{ background: "radial-gradient(circle, rgba(113,76,182,0.6) 0%, rgba(0,0,0,0) 70%)" }}></div>
          <div className="absolute top-10 right-[15%] w-[350px] h-[350px] rounded-full filter blur-[70px]" style={{ background: "radial-gradient(circle, rgba(255,51,102,0.4) 0%, rgba(0,0,0,0) 70%)" }}></div>
        </div>

        <div className="max-w-[850px] mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-parchment-canvas border border-driftwood rounded-full text-[10px] font-mono text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-iris"></span>
            <span>PREMIUM INTERACTIVE CABIN</span>
          </div>
          <h2 className="font-display font-bold text-ink text-3xl sm:text-4xl tracking-tight leading-tight max-w-2xl mx-auto">
            Ubah Gambar Menjadi Deskripsi <span className="text-iris font-semibold underline decoration-wavy underline-offset-4 decoration-1">Prompt Artistik</span> Presisi Tinggi.
          </h2>
          <p className="text-xs sm:text-sm text-graphite max-w-lg mx-auto leading-relaxed">
            Dapatkan formulasi prompt universal bahasa Inggris untuk Midjourney, DALL-E, & Stable Diffusion dari visualisasi foto apa pun dalam satu detik.
          </p>
        </div>
      </div>

      {/* 4. MAIN ENGINE CABIN */}
      <main id="workspace" className="flex-grow max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* ================= LEFT WING: PHOTO INPUTS & PREFERENCES ================= */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* PHOTO CABINET */}
          <div className="bg-white rounded-[24px] p-6 space-y-4 shadow-[0_4px_24px_rgba(41,40,39,0.02)] relative overflow-hidden">
            
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-iris"></span>
                Visual Source Scanner
              </span>
              {selectedImage && (
                <button 
                  onClick={() => {
                    setSelectedImage(null);
                    setAnalysisResult(null);
                    setError(null);
                  }}
                  className="text-rose-600 hover:text-rose-800 flex items-center gap-1 tracking-tight text-[11px] font-semibold transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> Bersihkan Bidang
                </button>
              )}
            </div>

            {/* DRAG AND DROP AREA */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) processSelectedFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] relative ${
                isDragOver ? "border-iris bg-lavender-chip/20" : "border-fog/80 bg-parchment-canvas/40 hover:bg-parchment-canvas/60"
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

              {selectedImage ? (
                <div className="relative group max-h-[180px] rounded-xl overflow-hidden bg-white p-1.5 shadow-xs">
                  <img 
                    src={selectedImage} 
                    alt="Visualization target" 
                    className="max-h-[150px] object-contain mx-auto rounded-lg" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-ink/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-mono font-bold">
                    Ganti Gambar
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-3 flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-graphite shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-ink">Seret & lepas berkas ke sini</p>
                    <p className="text-[10px] text-graphite">Atau <span className="text-iris font-semibold underline">cari dari komputer</span> (Max 10MB)</p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-800 flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* PARAMETERS CONTROL SWITCHBOARD */}
          <div className="bg-white rounded-[24px] p-6 space-y-6 shadow-[0_4px_24px_rgba(41,40,39,0.02)]">
            
            <div className="pb-1 flex items-center justify-between">
              <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-iris" />
                Parameter Bedahan Visual
              </span>
              <span className="text-[9px] font-mono font-bold bg-parchment-canvas/80 text-graphite/80 px-2 py-0.5 rounded uppercase tracking-wider">
                TWEAK CORE
              </span>
            </div>

            {/* A. PRIORITAS EKSTRAKSI */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-ink uppercase tracking-wider block">
                Fokus Prioritas Ekstraksi (Multiselect)
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_ASPECT_EXTRACT.map((a) => {
                  const isSelected = aspectToExtract.includes(a.id as any);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleToggleAspect(a.id as any)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold select-none transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-iris text-white shadow-[0_4px_12px_rgba(113,76,182,0.15)]" 
                          : "bg-parchment-canvas/60 text-ink/80 hover:bg-parchment-canvas hover:text-ink"
                      }`}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* B. DIMENSI RATIO & DETAIL COMPILER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-ink uppercase tracking-wider block">
                  Proporsi Aspek Rasio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full bg-parchment-canvas/40 border border-fog/50 hover:border-driftwood rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-iris cursor-pointer transition-all"
                >
                  {PRESET_RATIOS.map((r) => (
                    <option key={r.id} value={r.id}>
                      Midjourney --ar {r.id} ({r.label.split(' ')[1] || r.label})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-ink uppercase tracking-wider block">
                  Presisi Variasi Detalisis
                </label>
                <select
                  value={detailLevel}
                  onChange={(e) => setDetailLevel(e.target.value as any)}
                  className="w-full bg-parchment-canvas/40 border border-fog/50 hover:border-driftwood rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-iris cursor-pointer transition-all"
                >
                  {PRESET_DETAILS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* C. ART STYLE TRANSFORMERS */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-ink uppercase tracking-wider block">
                Transformasi Gaya Artistik (Opsional)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-parchment-canvas/30 p-1.5 rounded-2xl">
                {PRESET_STYLES.map((style) => {
                  const isStyleSelected = artisticStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setArtisticStyle(style.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                        isStyleSelected
                          ? "bg-white text-ink shadow-[0_4px_12px_rgba(41,40,39,0.04)]"
                          : "hover:bg-white/40 text-ink/75"
                      }`}
                    >
                      {style.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* D. CUSTOM COMMANDER */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-ink uppercase tracking-wider block">
                Interupsi Atmosfer / Custom Note
              </label>
              <input
                type="text"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Ex. 'buat bertema senja retro, ganti latar belakang menjadi kastil bergaya gothic...'"
                className="w-full bg-parchment-canvas/40 border border-fog/50 rounded-xl px-3 py-2 text-xs text-ink placeholder:text-graphite/55 focus:outline-none focus:border-iris"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <button
              onClick={handleAnalyzeImage}
              disabled={loading || !selectedImage}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                loading 
                  ? "bg-graphite cursor-wait" 
                  : !selectedImage 
                    ? "bg-fog text-graphite cursor-not-allowed" 
                    : "bg-aubergine hover:bg-aubergine-deep hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer"
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>MENGURAI PIKSEL SENI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>PREDIKSI PROMPT SEKARANG</span>
                </>
              )}
            </button>

          </div>

        </div>

        {/* ================= RIGHT WING: DECONSTRUCT BREAKDOWN ================= */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* LOADER PANELS */}
          {loading && (
            <div className="bg-white rounded-[24px] p-8 text-center space-y-5 min-h-[460px] flex flex-col justify-center items-center relative overflow-hidden shadow-[0_4px_24px_rgba(41,40,39,0.02)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-fog">
                <div 
                  className="bg-iris h-full transition-all duration-300 rounded" 
                  style={{ width: `${((loadingStep + 1) / progressSteps.length) * 100}%` }}
                />
              </div>
              
              <div className="h-14 w-14 rounded-full bg-parchment-canvas flex items-center justify-center text-iris shadow-2xs animate-pulse">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>

              <div className="space-y-1.5">
                <h4 className="font-display font-semibold text-ink text-base uppercase tracking-wider">
                  Menganalisis Karya Seni
                </h4>
                <p className="text-xs text-graphite max-w-[280px] mx-auto leading-relaxed">
                  Engine Gemini sedang memindai esensi terdalam visual ke dalam parameter generatif.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-iris bg-lavender-chip/40 px-3 py-1 rounded-full border border-iris/15 tracking-tight animate-bounce">
                {progressSteps[loadingStep]}
              </span>
            </div>
          )}

          {/* GENERATED PROMPT OUTPUT */}
          {!loading && analysisResult && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* COCKPIT RESULT CARRIER (Dark Themed For Premium Contrast Contrast) */}
              <div className="bg-ink text-white rounded-[24px] shadow-lg overflow-hidden relative">
                
                <div className="bg-neutral-900 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-bold text-lavender-chip uppercase tracking-widest flex items-center gap-1">
                      <Sparkle className="h-3 w-3 fill-lavender-chip" /> UNIVERSAL PROMPT CODE
                    </span>
                    <span className="text-[9px] text-white/50 block">Optimized directly for DALL-E, SD, & Midjourney</span>
                  </div>

                  <button
                    onClick={() => handleCopy(analysisResult.promptUniversal, 'universal')}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {copiedStates['universal'] ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 space-y-3.5">
                  <div className="p-3.5 bg-neutral-950/60 border border-white/10 rounded-xl font-mono text-xs text-white/95 leading-relaxed break-words select-all whitespace-pre-wrap">
                    {analysisResult.promptUniversal}
                  </div>
                  
                  {analysisResult.additionalTips && (
                    <div className="text-[11px] text-white/80 border-t border-white/10 pt-3 flex items-start gap-1.5 leading-relaxed">
                      <span className="font-bold text-lavender-chip shrink-0">PRO TIP:</span>
                      <span>{analysisResult.additionalTips}</span>
                    </div>
                  )}
                </div>

              </div>

              {/* INDONESIAN CONSTITUENTS BREAKDOWN CARDS */}
              <div className="bg-white rounded-[24px] p-6 space-y-5 shadow-[0_4px_24px_rgba(41,40,39,0.02)]">
                
                <div className="pb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-iris" />
                    Bongkahan Elemen Gambar
                  </span>
                  <span className="text-[9px] font-bold font-mono text-graphite/85 bg-parchment-canvas/80 px-2 py-0.5 rounded uppercase tracking-wider">
                    BAHASA INDONESIA
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                  
                  {/* MAIN SUBJECT (full size context) */}
                  <div className="p-4 bg-parchment-canvas/30 hover:bg-parchment-canvas/50 transition-colors rounded-2xl flex flex-col md:col-span-2 space-y-1.5">
                    <div className="flex items-center gap-2 text-ink">
                      <div className="p-1.5 rounded-lg bg-white shrink-0 text-iris shadow-2xs">
                        <Compass className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-ink">Subjek & Detail Konstruksi Body</span>
                    </div>
                    <p className="text-graphite text-xs leading-normal font-normal pl-0.5">{analysisResult.subject}</p>
                  </div>

                  {/* SIDE-BY-SIDE: GAYA */}
                  <div className="p-4 bg-parchment-canvas/30 hover:bg-parchment-canvas/50 transition-colors rounded-2xl flex flex-col space-y-1.5">
                    <div className="flex items-center gap-2 text-ink">
                      <div className="p-1.5 rounded-lg bg-white shrink-0 text-iris shadow-2xs">
                        <Cpu className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-ink">Medium Seni & Gaya Gambar</span>
                    </div>
                    <p className="text-graphite text-xs leading-normal font-normal pl-0.5">{analysisResult.style}</p>
                  </div>

                  {/* SIDE-BY-SIDE: WARNA */}
                  <div className="p-4 bg-parchment-canvas/30 hover:bg-parchment-canvas/50 transition-colors rounded-2xl flex flex-col space-y-1.5">
                    <div className="flex items-center gap-2 text-ink">
                      <div className="p-1.5 rounded-lg bg-white shrink-0 text-iris shadow-2xs">
                        <Palette className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-ink">Palet Warna Utama</span>
                    </div>
                    <p className="text-graphite text-xs leading-normal font-normal pl-0.5">{analysisResult.colors}</p>
                  </div>

                  {/* SIDE-BY-SIDE: KOMPOSISI */}
                  <div className="p-4 bg-parchment-canvas/30 hover:bg-parchment-canvas/50 transition-colors rounded-2xl flex flex-col space-y-1.5">
                    <div className="flex items-center gap-2 text-ink">
                      <div className="p-1.5 rounded-lg bg-white shrink-0 text-iris shadow-2xs">
                        <Monitor className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-ink">Lensa & Susunan Komposisi</span>
                    </div>
                    <p className="text-graphite text-xs leading-normal font-normal pl-0.5">{analysisResult.composition}</p>
                  </div>

                  {/* SIDE-BY-SIDE: ATMOSFER */}
                  <div className="p-4 bg-parchment-canvas/30 hover:bg-parchment-canvas/50 transition-colors rounded-2xl flex flex-col space-y-1.5">
                    <div className="flex items-center gap-2 text-ink">
                      <div className="p-1.5 rounded-lg bg-white shrink-0 text-iris shadow-2xs">
                        <Lightbulb className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-ink">Pendaran Cahaya & Atmosfer</span>
                    </div>
                    <p className="text-graphite text-xs leading-normal font-normal pl-0.5">{analysisResult.lighting}</p>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* FALLBACK BLANK CABINET */}
          {!loading && !analysisResult && (
            <div className="bg-white rounded-[24px] p-8 text-center space-y-4 min-h-[440px] flex flex-col justify-center items-center shadow-[0_4px_24px_rgba(41,40,39,0.02)]">
              <div className="h-12 w-12 rounded-full bg-parchment-canvas flex items-center justify-center text-graphite/70 shadow-2xs">
                <Sliders className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-ink uppercase tracking-wide">
                  Visualisasi Belum Dibedah
                </h4>
                <p className="text-xs text-graphite max-w-[260px] mx-auto leading-relaxed">
                  Unggah foto kreasi Anda di panel sebelah kiri, atau pilih salah satu ilustrasi di galeri instan di bawah ini.
                </p>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* 5. INSTANT VISUAL TESTBENCH GALLERY */}
      <section className="bg-white border-t border-fog py-10 px-4 shrink-0">
        <div className="max-w-[1200px] mx-auto space-y-4">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-2 w-2 rounded-full bg-iris"></span>
            <h3 className="font-display font-semibold text-xs text-ink uppercase tracking-wider">
              Uji Coba Instan dengan Galeri Visual
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SAMPLE_IMAGES.map((sample) => {
              const isActive = selectedImage === sample.imageUrl;
              return (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className={`cursor-pointer rounded-2xl overflow-hidden bg-white p-2 transition-all duration-300 outline-none ${
                    isActive 
                      ? "ring-2 ring-iris shadow-[0_8px_24px_rgba(113,76,182,0.12)]" 
                      : "shadow-[0_2px_12px_rgba(41,40,39,0.015)] hover:shadow-[0_8px_24px_rgba(41,40,39,0.04)] hover:-translate-y-0.5"
                  }`}
                >
                  <div className="h-20 w-full overflow-hidden rounded-lg relative">
                    <img 
                      src={sample.imageUrl} 
                      alt={sample.title} 
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="pt-2 px-1 text-center">
                    <h5 className="text-[11px] font-bold text-ink truncate leading-tight select-none">{sample.title}</h5>
                    <p className="text-[9px] text-graphite font-mono uppercase tracking-wider mt-0.5 select-none">{sample.category}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. CORNERED COCKPIT BRACKET FOOTER */}
      <footer className="bg-white border-t border-fog py-5 px-4 text-center text-xs text-graphite shrink-0 mt-auto">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1">
            Membangun masa depan seni dengan <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> &bull; AuraPrompt Pro
          </p>
          <p className="text-[10px] font-mono text-graphite/80">
            Powered by Gemini Multi-Response Architecture &bull; API Shield Active
          </p>
        </div>
      </footer>

    </div>
  );
}
