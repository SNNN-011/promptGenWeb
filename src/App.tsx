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
  Sparkle,
  Instagram,
  ChevronDown,
  ChevronUp,
  Settings,
  Image,
  ArrowRight
} from "lucide-react";
import { SAMPLE_IMAGES, PRESET_RATIOS, PRESET_STYLES, PRESET_DETAILS, PRESET_ASPECT_EXTRACT } from "./data";
import { ImageAnalysisResponse } from "./types";

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(SAMPLE_IMAGES[0].imageUrl);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  
  const [aspectToExtract, setAspectToExtract] = useState<('semua' | 'subjek' | 'gaya' | 'komposisi' | 'pencahayaan' | 'warna')[]>(["semua"]);
  const [generator] = useState<string>("Nano Banana Engine");
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

  // Accordion open/close states for parameters panel
  const [openParams, setOpenParams] = useState<Record<string, boolean>>({
    extraction: true,
    format: true,
    style: false,
    custom: false
  });

  const toggleParamSection = (section: string) => {
    setOpenParams(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Stacked accordion states for Indonesian Visual Breakdown result
  const [openBreakdown, setOpenBreakdown] = useState<Record<string, boolean>>({
    subject: true,
    style: false,
    colors: false,
    composition: false,
    lighting: false
  });

  const toggleBreakdownSec = (key: string) => {
    setOpenBreakdown(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
    
    // Auto scroll down to workspace smoothly
    document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" });
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
      
      // Auto expand relevant breakdown tabs
      setOpenBreakdown({
        subject: true,
        style: true,
        colors: true,
        composition: true,
        lighting: true
      });
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
    <div className="min-h-screen bg-white text-[#111111] font-sans selection:bg-[#5B4FD8]/10 selection:text-[#5B4FD8]">
      
      {/* NAVIGATION BAR - Sticky, translucent, minimal */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100 px-6 py-4">
        <div className="max-w-[1120px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-sans font-medium text-base tracking-tight text-[#111111]">NanoPrompt</span>
            <span className="text-[9px] font-bold tracking-wider bg-[#111111] text-white px-1.5 py-0.5 rounded-full">PRO</span>
            <div className="hidden sm:flex items-center gap-1.5 ml-4 text-[10px] text-[#6B6B6B] font-mono uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Gemini 3.x Failover Engine Active</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-sm text-[#6B6B6B]">
              <a href="#workspace" className="hover:text-[#111111] transition-colors">Workspace</a>
              <a href="#gallery" className="hover:text-[#111111] transition-colors">Galeri Instan</a>
            </div>
            <a 
              href="#workspace"
              onClick={() => {
                setSelectedImage(SAMPLE_IMAGES[0].imageUrl);
                setAnalysisResult(SAMPLE_IMAGES[0].precalculatedResponse);
                setAspectToExtract(["semua"]);
                setArtisticStyle("original");
                setAspectRatio("16:9");
                setDetailLevel("balanced");
                setCustomInstructions("");
              }}
              className="text-xs font-medium text-[#111111] hover:text-[#5B4FD8] transition-colors border border-[#EBEBEB] hover:border-[#CCCCCC] px-3.5 py-1.5 rounded-full"
            >
              Reset Cabin
            </a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - Minimal, large, left-aligned, breathing room */}
      <header className="relative py-[90px] px-6 overflow-hidden">
        {/* Subtle, beautiful soft background radial aura */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-[#5B4FD8]/5 to-transparent filter blur-3xl pointer-events-none rounded-full"></div>
        
        <div className="max-w-[1120px] mx-auto relative z-10">
          <p className="text-[11px] font-medium tracking-widest text-[#5B4FD8] uppercase mb-4">
            AI-POWERED IMAGE TO ARTISTIC PROMPT CONVERTER
          </p>
          <h1 className="text-4xl sm:text-6xl lg:text-[76px] font-light text-[#111111] leading-[1.1] tracking-tight max-w-4xl mb-6">
            Ubah Gambar Menjadi Deskripsi Prompt Artistik.
          </h1>
          <p className="text-base sm:text-lg text-[#6B6B6B] leading-relaxed max-w-2xl mb-8">
            Dapatkan deskripsi visual presisi tingkat tinggi serta formulasi prompt universal bahasa Inggris untuk Nano Banana langsung dari visualisasi foto apa pun dalam satu detik.
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#workspace"
              className="inline-flex items-center gap-2 bg-[#5B4FD8] hover:bg-[#4A3EBE] text-white text-sm font-medium px-6 py-3 rounded-full shadow-xs hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <span>Mulai Bedah Gambar</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <span className="text-xs font-mono text-[#6B6B6B] flex items-center gap-1.5 ml-1">
              <span>EST. PROCESSING: ~2s</span>
              <span>&bull;</span>
              <span>POWERED BY GEMINI</span>
            </span>
          </div>
        </div>
      </header>

      {/* OFF-WHITE SECTION BOUNDARY FOR WORKSPACE */}
      <section className="bg-[#F7F7F5] border-t border-neutral-100/60 py-[100px] px-6">
        <main id="workspace" className="max-w-[1120px] mx-auto">
          
          {/* Subtitle above workspace grid */}
          <div className="mb-10 text-left">
            <p className="text-[11px] font-bold tracking-wider text-[#6B6B6B] uppercase mb-1">INTERACTIVE DESK</p>
            <h2 className="text-2xl font-normal text-[#111111] tracking-tight">Main Workbench Cabin</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* LEFT COLUMN: Input and Parameters */}
            <div className="space-y-8">
              
              {/* IMAGE UPLOADER CARD */}
              <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 transition-all hover:border-[#CCCCCC]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B] block">
                    Source Visual File
                  </span>
                  {selectedImage && (
                    <button 
                      onClick={() => {
                        setSelectedImage(null);
                        setAnalysisResult(null);
                        setError(null);
                      }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1"
                    >
                      <X className="h-3.5 w-3.5" /> Bersihkan
                    </button>
                  )}
                </div>

                {/* DRAG-AND-DROP CONTAINER */}
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) processSelectedFile(f); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[180px] bg-[#F7F7F5] ${
                    isDragOver ? "border-[#5B4FD8] bg-[#5B4FD8]/5" : "border-neutral-200 hover:bg-neutral-100/40"
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                  {selectedImage ? (
                    <div className="relative group max-h-[220px] rounded-lg overflow-hidden bg-white p-2">
                      <img 
                        src={selectedImage} 
                        alt="Target visualizer" 
                        className="max-h-[180px] object-contain mx-auto rounded-md" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-[#111111]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                        Ganti Gambar
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-4 flex flex-col items-center">
                      <div className="h-10 w-10 rounded-full bg-white border border-neutral-100 flex items-center justify-center text-[#6B6B6B]">
                        <Upload className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-[#111111]">Seret & lepaskan berkas gambar ke sini</p>
                        <p className="text-[11px] text-[#6B6B6B]">atau klik untuk menautkan berkas dari komputer (Maksimal 10MB)</p>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* PARAMETER CONFIGURATION - Clean Collapsible Accordion Groups */}
              <div className="space-y-4">
                
                {/* 1. EXTRACT PRIORITIES ACCORDION */}
                <div className="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden transition-all hover:border-[#CCCCCC]">
                  <button 
                    type="button"
                    onClick={() => toggleParamSection('extraction')}
                    className="w-full px-6 py-4 flex items-center justify-between text-left select-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sliders className="h-4 w-4 text-[#5B4FD8]" />
                      <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                        1. Pilih yang Akan Dianalisis
                      </span>
                    </div>
                    {openParams.extraction ? <ChevronUp className="h-4 w-4 text-[#6B6B6B]" /> : <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />}
                  </button>

                  {openParams.extraction && (
                    <div className="px-6 pb-6 border-t border-neutral-50 pt-4 space-y-3">
                      <p className="text-xs text-[#6B6B6B] mb-2 leading-relaxed">
                        Centang komponen visual yang ingin Anda prioritaskan untuk diekstrak menjadi penegas prompt.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_ASPECT_EXTRACT.map((a) => {
                          const isSelected = aspectToExtract.includes(a.id as any);
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => handleToggleAspect(a.id as any)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                                isSelected 
                                  ? "bg-[#5B4FD8] text-white" 
                                  : "bg-[#F0F0F0] text-[#111111]/80 hover:bg-[#EAEAEA]"
                              }`}
                            >
                              {a.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. FORMAT & RATIO ACCORDION */}
                <div className="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden transition-all hover:border-[#CCCCCC]">
                  <button 
                    type="button"
                    onClick={() => toggleParamSection('format')}
                    className="w-full px-6 py-4 flex items-center justify-between text-left select-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Monitor className="h-4 w-4 text-[#5B4FD8]" />
                      <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                        2. Format Aspek Rasio & Detalitas
                      </span>
                    </div>
                    {openParams.format ? <ChevronUp className="h-4 w-4 text-[#6B6B6B]" /> : <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />}
                  </button>

                  {openParams.format && (
                    <div className="px-6 pb-6 border-t border-neutral-50 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-[#6B6B6B] block">
                          Aspek Rasio Gambar
                        </label>
                        <select
                          value={aspectRatio}
                          onChange={(e) => setAspectRatio(e.target.value)}
                          className="w-full bg-[#F7F7F5] border-none rounded-lg px-3 py-2 text-xs text-[#111111] focus:ring-1 focus:ring-[#5B4FD8] cursor-pointer"
                        >
                          {PRESET_RATIOS.map((r) => (
                            <option key={r.id} value={r.id}>
                              Nano Banana --ar {r.id}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-[#6B6B6B] block">
                          Tingkat Presisi Variasi
                        </label>
                        <select
                          value={detailLevel}
                          onChange={(e) => setDetailLevel(e.target.value as any)}
                          className="w-full bg-[#F7F7F5] border-none rounded-lg px-3 py-2 text-xs text-[#111111] focus:ring-1 focus:ring-[#5B4FD8] cursor-pointer"
                        >
                          {PRESET_DETAILS.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. ART STYLE INTERPRETATIONS */}
                <div className="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden transition-all hover:border-[#CCCCCC]">
                  <button 
                    type="button"
                    onClick={() => toggleParamSection('style')}
                    className="w-full px-6 py-4 flex items-center justify-between text-left select-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Palette className="h-4 w-4 text-[#5B4FD8]" />
                      <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                        3. Transformasi Gaya Seni (Satu Pilihan)
                      </span>
                    </div>
                    {openParams.style ? <ChevronUp className="h-4 w-4 text-[#6B6B6B]" /> : <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />}
                  </button>

                  {openParams.style && (
                    <div className="px-6 pb-6 border-t border-neutral-50 pt-4 space-y-3">
                      <p className="text-xs text-[#6B6B6B]">
                        Alas gaya seni baru di atas parameter gambar asli Anda. Generator akan menggabungkan tekstur ini.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {PRESET_STYLES.map((style) => {
                          const isActive = artisticStyle === style.id;
                          return (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => setArtisticStyle(style.id)}
                              className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                                isActive 
                                  ? "bg-[#5B4FD8] text-white" 
                                  : "bg-[#F7F7F5] text-[#111111]/80 hover:bg-[#EBEBEB]"
                              }`}
                            >
                              {style.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. CUSTOM NOTES ACCORDION */}
                <div className="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden transition-all hover:border-[#CCCCCC]">
                  <button 
                    type="button"
                    onClick={() => toggleParamSection('custom')}
                    className="w-full px-6 py-4 flex items-center justify-between text-left select-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="h-4 w-4 text-[#5B4FD8]" />
                      <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                        4. Catatan Tambahan
                      </span>
                    </div>
                    {openParams.custom ? <ChevronUp className="h-4 w-4 text-[#6B6B6B]" /> : <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />}
                  </button>

                  {openParams.custom && (
                    <div className="px-6 pb-6 border-t border-neutral-50 pt-4 space-y-1.5">
                      <p className="text-xs text-[#6B6B6B] mb-2">
                        Tambahkan instruksi spesifik Anda (misalnya: "ubah latar belakang menjadi kastil abad pertengahan").
                      </p>
                      <input
                        type="text"
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        placeholder="Atmospheric modifier atau instruksi tambahan..."
                        className="w-full bg-[#F7F7F5] border-none rounded-lg px-4 py-3 text-xs text-[#111111] placeholder:text-neutral-400 focus:ring-1 focus:ring-[#5B4FD8]"
                      />
                    </div>
                  )}
                </div>

              </div>

              {/* ACTION EXECUTE BUTTON - Big rounded full pill */}
              <button
                type="button"
                onClick={handleAnalyzeImage}
                disabled={loading || !selectedImage}
                className={`w-full py-4 rounded-full font-medium text-sm tracking-wide transition-all select-none cursor-pointer flex items-center justify-center gap-2 ${
                  loading 
                    ? "bg-[#6B6B6B] text-white cursor-wait" 
                    : !selectedImage 
                      ? "bg-neutral-200 text-[#6B6B6B] cursor-not-allowed" 
                      : "bg-[#5B4FD8] hover:bg-[#4A3EBE] text-white active:scale-[0.99]"
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>MENGANALISIS DATA GAMBAR...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>BUAT PROMPT SEKARANG</span>
                  </>
                )}
              </button>

            </div>

            {/* RIGHT COLUMN: Results and breakdowns */}
            <div className="space-y-8">
              
              {/* INTERMEDIARY LOADER STATUS */}
              {loading && (
                <div className="bg-white border border-[#EBEBEB] rounded-2xl p-8 text-center min-h-[460px] flex flex-col justify-center items-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-neutral-100">
                    <div 
                      className="bg-[#5B4FD8] h-full transition-all duration-300" 
                      style={{ width: `${((loadingStep + 1) / progressSteps.length) * 100}%` }}
                    />
                  </div>
                  
                  <div className="h-12 w-12 rounded-full bg-[#F7F7F5] flex items-center justify-center text-[#5B4FD8] mb-4">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  </div>

                  <h3 className="text-sm font-medium uppercase tracking-wider text-[#111111] mb-2">Analyzing Cosmic Pixels</h3>
                  <p className="text-xs text-[#6B6B6B] max-w-xs mx-auto mb-6 leading-relaxed">
                    Model AI canggih server-side Gemini tengah membongkar struktur batin foto Anda ke dalam metrik parameter seni generator.
                  </p>

                  <span className="text-xs font-mono font-medium text-[#5B4FD8] bg-[#5B4FD8]/5 px-3 py-1.5 rounded-full border border-[#5B4FD8]/10">
                    {progressSteps[loadingStep]}
                  </span>
                </div>
              )}

              {/* MAIN PROMPT CODE BLOCK OUTPUT */}
              {!loading && analysisResult && (
                <div className="space-y-8">
                  
                  {/* GENERATED PROMPT OUTPUT BOX */}
                  <div className="bg-[#111111] text-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-neutral-900/60 px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono tracking-wider font-bold text-neutral-400 block uppercase">
                          NANO BANANA PROMPT CODE
                        </span>
                        <span className="text-[9px] text-[#6B6B6B] block">Optimized directly for Nano Banana engine</span>
                      </div>

                      <button
                        onClick={() => handleCopy(analysisResult.promptUniversal, 'universal')}
                        className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedStates['universal'] ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-white/80" />
                            <span>Salin Prompt</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-6">
                      <div className="p-4 bg-neutral-950/80 rounded-xl font-mono text-sm text-neutral-200 leading-relaxed break-words select-all whitespace-pre-wrap select-all">
                        {analysisResult.promptUniversal}
                      </div>
                    </div>
                  </div>

                  {/* HIGH-END STACKED ACCORDIONS FOR INDONESIAN BREAKDOWN */}
                  <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 space-y-4">
                    <div className="pb-2 border-b border-neutral-50">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B] block">
                        Bongkahan Elemen Gambar (Bahasa Indonesia)
                      </span>
                    </div>

                    <div className="space-y-2">
                      
                      {/* A. SUBJEK ACCORDION */}
                      <div className="border border-neutral-100 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleBreakdownSec('subject')}
                          className="w-full px-4 py-3 bg-[#F7F7F5]/40 hover:bg-[#F7F7F5] flex items-center justify-between text-left cursor-pointer transition-colors"
                        >
                          <span className="text-xs font-semibold text-[#111111]">Subjek & Konstruksi Karakter</span>
                          {openBreakdown.subject ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                        {openBreakdown.subject && (
                          <div className="p-4 text-xs text-[#6B6B6B] leading-relaxed border-t border-neutral-100 bg-white">
                            {analysisResult.subject}
                          </div>
                        )}
                      </div>

                      {/* B. GAYA ACCORDION */}
                      <div className="border border-neutral-100 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleBreakdownSec('style')}
                          className="w-full px-4 py-3 bg-[#F7F7F5]/40 hover:bg-[#F7F7F5] flex items-center justify-between text-left cursor-pointer transition-colors"
                        >
                          <span className="text-xs font-semibold text-[#111111]">Karya Seni & Medium Gaya</span>
                          {openBreakdown.style ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                        {openBreakdown.style && (
                          <div className="p-4 text-xs text-[#6B6B6B] leading-relaxed border-t border-neutral-100 bg-white">
                            {analysisResult.style}
                          </div>
                        )}
                      </div>

                      {/* C. WARNA ACCORDION */}
                      <div className="border border-neutral-100 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleBreakdownSec('colors')}
                          className="w-full px-4 py-3 bg-[#F7F7F5]/40 hover:bg-[#F7F7F5] flex items-center justify-between text-left cursor-pointer transition-colors"
                        >
                          <span className="text-xs font-semibold text-[#111111]">Color Grading & Skema Warna</span>
                          {openBreakdown.colors ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                        {openBreakdown.colors && (
                          <div className="p-4 text-xs text-[#6B6B6B] leading-relaxed border-t border-neutral-100 bg-white">
                            {analysisResult.colors}
                          </div>
                        )}
                      </div>

                      {/* D. KOMPOSISI ACCORDION */}
                      <div className="border border-neutral-100 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleBreakdownSec('composition')}
                          className="w-full px-4 py-3 bg-[#F7F7F5]/40 hover:bg-[#F7F7F5] flex items-center justify-between text-left cursor-pointer transition-colors"
                        >
                          <span className="text-xs font-semibold text-[#111111]">Kamera, Lensa & Komposisi</span>
                          {openBreakdown.composition ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                        {openBreakdown.composition && (
                          <div className="p-4 text-xs text-[#6B6B6B] leading-relaxed border-t border-neutral-100 bg-white">
                            {analysisResult.composition}
                          </div>
                        )}
                      </div>

                      {/* E. PENCINTA CAHAYA ACCORDION */}
                      <div className="border border-neutral-100 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleBreakdownSec('lighting')}
                          className="w-full px-4 py-3 bg-[#F7F7F5]/40 hover:bg-[#F7F7F5] flex items-center justify-between text-left cursor-pointer transition-colors"
                        >
                          <span className="text-xs font-semibold text-[#111111]">Pencahayaan & Atmosfer</span>
                          {openBreakdown.lighting ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                        {openBreakdown.lighting && (
                          <div className="p-4 text-xs text-[#6B6B6B] leading-relaxed border-t border-neutral-100 bg-white">
                            {analysisResult.lighting}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                </div>
              )}

              {/* UNANALYSED LANDING SCREEN WITH TIPS */}
              {!loading && !analysisResult && (
                <div className="bg-white border border-[#EBEBEB] rounded-2xl p-8 text-center min-h-[440px] flex flex-col justify-center items-center">
                  <div className="h-10 w-10 bg-[#F7F7F5] rounded-full flex items-center justify-center text-[#6B6B6B] mb-4">
                    <Sliders className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-medium uppercase tracking-wider text-[#111111] mb-2 leading-none">
                    Kabin Deteksi Masih Kosong
                  </h4>
                  <p className="text-xs text-[#6B6B6B] max-w-xs mx-auto leading-relaxed">
                    Unggah rancangan visual Anda di panel kiri atau ketuk salah satu gambar contoh di galeri galon uji coba instan di bawah ini.
                  </p>
                </div>
              )}

            </div>

          </div>

        </main>
      </section>

      {/* GALLERY SECTION: Horizontal/strip grids with metadata and interactions */}
      <section id="gallery" className="bg-white border-t border-neutral-100 py-[100px] px-6">
        <div className="max-w-[1120px] mx-auto space-y-8">
          
          <div className="text-left space-y-1">
            <p className="text-[11px] font-bold tracking-widest text-[#6B6B6B] uppercase">INSTANT EVALUATION</p>
            <h3 className="text-2xl font-normal text-[#111111] tracking-tight">
              Galeri Uji Coba Instan
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Klik salah satu gambar artistik di bawah untuk langsung menguji kepiawaian analisis dekonstruksi prompt engine Nano Banana.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {SAMPLE_IMAGES.map((sample) => {
              const isActive = selectedImage === sample.imageUrl;
              return (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className={`group cursor-pointer rounded-2xl overflow-hidden bg-white border p-2 transition-all duration-300 outline-none ${
                    isActive 
                      ? "border-[#5B4FD8] ring-1 ring-[#5B4FD8]" 
                      : "border-[#EBEBEB] hover:border-[#CCCCCC]"
                  }`}
                >
                  <div className="h-32 w-full overflow-hidden rounded-xl relative bg-[#F7F7F5]">
                    <img 
                      src={sample.imageUrl} 
                      alt={sample.title} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    {/* Hover subtle label overlay */}
                    <div className="absolute inset-0 bg-[#111111]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-white font-semibold bg-[#111111]/80 px-2.5 py-1 rounded-full">
                        Load preset
                      </span>
                    </div>
                  </div>
                  <div className="pt-3 px-1.5 space-y-0.5">
                    <h5 className="text-xs font-semibold text-[#111111] truncate">{sample.title}</h5>
                    <p className="text-[10px] text-[#6B6B6B] uppercase font-mono tracking-wider">{sample.category}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* MINIMAL ONE-LINE FOOTER - No heavy borders */}
      <footer className="bg-white border-t border-neutral-100/60 py-8 px-6 text-[#6B6B6B] text-xs">
        <div className="max-w-[1120px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#111111]">NanoPrompt Pro</span>
            <span>&bull;</span>
            <span className="text-[11px]">Terus Belajar</span>
          </div>

          <p className="text-[10px] text-[#6B6B6B]/80 font-mono">
            Unveiling high-end visual prompts &bull; Armed with Gemini
          </p>

          <a 
            href="https://instagram.com/snnn_0110001" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-[#5B4FD8] font-medium transition-colors inline-flex items-center gap-1"
          >
            <Instagram className="h-3.5 w-3.5" />
            <span>Instagram</span>
          </a>
        </div>
      </footer>

    </div>
  );
}
