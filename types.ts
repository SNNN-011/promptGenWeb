export interface AnalysisPreferences {
  generator?: string;
  aspectRatio?: string;
  artisticStyle?: string;
  detailLevel?: string;
  customInstructions?: string;
  aspectToExtract?: string[];
}

export interface AnalysisRequest {
  image: string;
  mimeType: string;
  preferences?: AnalysisPreferences;
}

export interface AnalysisResponse {
  subject: string;
  style: string;
  composition: string;
  lighting: string;
  colors: string;
  promptUniversal: string;
  additionalTips: string;
}
