export interface ImageAnalysisRequest {
  image: string; // base64 encoded string
  mimeType: string; // e.g. "image/jpeg", "image/png"
  preferences?: {
    generator: string;
    aspectRatio: string;
    artisticStyle: string;
    detailLevel: 'compact' | 'balanced' | 'highly-detailed';
    customInstructions?: string;
    aspectToExtract: ('semua' | 'subjek' | 'gaya' | 'komposisi' | 'pencahayaan' | 'warna')[];
  };
}

export interface ImageAnalysisResponse {
  subject: string;
  style: string;
  composition: string;
  lighting: string;
  colors: string;
  promptUniversal: string;
  additionalTips: string;
}
