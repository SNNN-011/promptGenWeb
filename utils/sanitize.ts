// Input sanitization for AI prompt construction

const ALLOWED_GENERATORS = ["midjourney", "dalle", "stable-diffusion", "nano-banana", "flux", "ideogram"];
const ALLOWED_ASPECTS = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"];
const ALLOWED_DETAIL = ["compact", "balanced", "detailed"];
const ALLOWED_STYLES = [
  "keep-original", "cyberpunk", "classic-oil-painting", "retro-anime",
  "cinematic-drama", "watercolor", "pixel-art", "minimalist", "surrealism",
  "pop-art", "impressionism", "gothic", "vaporwave", "synthwave",
];
const MAX_CUSTOM_INSTRUCTIONS_LEN = 500;

function stripPromptInjection(text: string): string {
  // Remove common prompt injection patterns
  return text
    .replace(/\n/g, " ")           // collapse newlines
    .replace(/[<>{}]/g, "")         // remove template delimiters
    .replace(/ignore.*previous/gi, "")
    .replace(/system.*prompt/gi, "")
    .replace(/you are now/gi, "")
    .replace(/forget.*instructions/gi, "")
    .replace(/override.*system/gi, "")
    .replace(/\{\{.*?\}\}/g, "")  // remove template vars
    .trim();
}

function validateEnum(value: string, allowed: string[], fallback: string): string {
  const v = value?.toLowerCase().trim();
  return allowed.includes(v) ? v : fallback;
}

export function sanitizePreferences(prefs: any): any {
  if (!prefs) return null;

  return {
    generator: validateEnum(prefs.generator, ALLOWED_GENERATORS, "nano-banana"),
    aspectRatio: validateEnum(prefs.aspectRatio, ALLOWED_ASPECTS, "1:1"),
    artisticStyle: validateEnum(prefs.artisticStyle, ALLOWED_STYLES, "keep-original"),
    detailLevel: validateEnum(prefs.detailLevel, ALLOWED_DETAIL, "balanced"),
    customInstructions: prefs.customInstructions
      ? stripPromptInjection(prefs.customInstructions).slice(0, MAX_CUSTOM_INSTRUCTIONS_LEN)
      : "",
    aspectToExtract: Array.isArray(prefs.aspectToExtract)
      ? prefs.aspectToExtract.filter((a: string) =>
          ["semua", "warna", "subjek", "gaya", "komposisi", "pencahayaan"].includes(a)
        )
      : ["semua"],
  };
}
