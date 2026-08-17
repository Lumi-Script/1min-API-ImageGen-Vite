// ==========================================
// GPT Image 1 Types & Defaults
// Reference: https://docs.1min.ai/docs/api/ai-for-image/image-generator/gpt-image-1-image-generation
// ==========================================
export type GptImage1Size = "1024x1024" | "1024x1536" | "1536x1024";
export type GptImage1Quality = "low" | "medium" | "high";
export type GptImage1Style = "vivid" | "natural";
export type GptImage1OutputFormat = "png" | "jpeg" | "webp";
export type GptImage1Background = "opaque" | "transparent";

export interface GptImage1PromptObject {
  prompt: string; // Required
  n?: number; // 1-10, default 1
  size?: GptImage1Size; // default "1024x1024"
  quality?: GptImage1Quality; // default "medium"
  style?: GptImage1Style; // default "vivid"
  output_format?: GptImage1OutputFormat; // default "png"
  output_compression?: number; // 0-100, default 85
  background?: GptImage1Background; // default "opaque"
}

export type GptImage1PromptConfig = Omit<GptImage1PromptObject, "prompt">;

export interface GptImage1Payload {
  type: "IMAGE_GENERATOR";
  model: "gpt-image-1" | "gpt-image-1-mini";
  promptObject: GptImage1PromptObject;
}



// ==========================================
// GPT Image 2 Types & Defaults
// Reference: https://docs.1min.ai/docs/api/ai-for-image/image-generator/gpt-image-2-image-generation
// ==========================================
export type GptImage2Quality = "low" | "medium" | "high";
export type GptImage2Background = "auto" | "opaque";
export type GptImage2OutputFormat = "png" | "jpeg" | "webp";

/**
 * Size constraints for GPT Image 2:
 * - Block size: Width and height must both be divisible by 16
 * - Minimum pixels: Width * Height >= 655,360
 * - Maximum pixels: Width * Height <= 8,294,400
 * - Maximum edge: Max(width, height) <= 3,840 px
 * - Aspect ratio: Max edge / Min edge <= 3:1
 */
export type GptImage2Size = `${number}x${number}` | "1024x1024" | "1536x1024" | "1024x1536";

export interface GptImage2PromptObject {
  prompt: string; // Required, max 4000 characters
  size: GptImage2Size; // Required
  quality: GptImage2Quality; // Required
  n?: number; // 1-10, default 1
  background?: GptImage2Background; // default "auto"
  output_format?: GptImage2OutputFormat;
  output_compression?: number; // 0-100, applies when output_format is jpeg or webp
}

export type GptImage2PromptConfig = Omit<GptImage2PromptObject, "prompt">;

export interface GptImage2Payload {
  type: "IMAGE_GENERATOR";
  model: "gpt-image-2";
  promptObject: GptImage2PromptObject;
}

// ==========================================
// Flux Types & Defaults
// Reference: https://docs.1min.ai/docs/api/ai-for-image/image-generator/flux-2-klein-4b-image-generation
// Reference: https://docs.1min.ai/docs/api/ai-for-image/image-generator/flux-2-klein-9b-image-generation
// ==========================================
export type FluxAspectRatio = "1:1" | "16:9" | "9:16" | "3:2" | "2:3" | "4:5" | "5:4";
export type FluxOutputFormat = "webp" | "jpg" | "png";
export type FluxMegapixels = "0.25" | "1";

export interface FluxPromptObject {
  prompt: string; // Required. Text description of the image to generate
  aspect_ratio?: FluxAspectRatio; // default "1:1"
  num_inference_steps?: number; // 1-4, default 4
  go_fast?: boolean; // Enable fastest generation mode, default true
  megapixels?: FluxMegapixels; // Output resolution in megapixels, default "1"
  output_format?: FluxOutputFormat; // default "webp"
  output_quality?: number; // 0-100, default 80
  disable_safety_checker?: boolean; // Disable built-in safety filtering, default false
  seed?: number; // Random seed for reproducibility
}

export type FluxPromptConfig = Omit<FluxPromptObject, "prompt">;



// ==========================================
// Dzine Types & Defaults
// Reference: https://docs.1min.ai/docs/api/ai-for-image/image-generator/dzine-image-generation
// ==========================================
import dzineStylesData from './dzine.json';

export type DzineImageQuality = "STANDARD" | "HIGH";
export type DzineOutputFormat = "jpeg" | "webp";
export type DzineBaseModel = "S" | "X";
export type DzineSize = `${number}x${number}` | "1024x1024";

export interface DzineStyle {
  style_code: string; // Required. Style code from Dzine's style library
  style_base_model: DzineBaseModel | string; // Required. Base model from Dzine's style library: "S" or "X"
  style_intensity: number; // Optional. Strength of style applied (0.0-1.0 in 0.1 increments), default 0
}

export const DzineStyles = dzineStylesData as Array<DzineStyle & { name: string }>;

export interface DzinePromptObject extends DzineStyle {
  prompt: string; // Required. Text description of the image to generate
  size?: DzineSize; // Image dimensions in format "WIDTHxHEIGHT" (128-1536 pixels), default "1024x1024"
  n?: number; // Required. Number of images to generate (1-4), default 1
  quality?: DzineImageQuality; // Required. Image quality mode: "STANDARD" or "HIGH", default "STANDARD"
  output_format?: DzineOutputFormat; // Required. Output format: "webp" or "jpeg", default "webp"
  seed?: number; // Optional. Random seed for reproducibility (1-2147483647)
  face_match?: boolean; // Optional. Enable face matching from reference image, default false
  face_match_image?: string; // Optional. Asset path to reference face image (required if face_match is true)
}

export type DzinePromptConfig = Omit<DzinePromptObject, "prompt">;





// ==========================================
// Stable Image Upscaler Types & Defaults
// Reference: https://docs.1min.ai/docs/api/ai-for-image/image-upscaler/stable-image-upscaler
// ==========================================
export type StableImageOutputFormat = "png" | "jpeg" | "webp";

export interface StableImageUpscalerPromptObject {
  imageUrl: string; // Required. Path to the image to be upscaled
  output_format?: StableImageOutputFormat; // Optional. Output format for the upscaled image, default "png"
}

export type StableImageUpscalerPromptConfig = Omit<StableImageUpscalerPromptObject, "imageUrl">;



// ==========================================
// Generic Config Types
// ==========================================
export type AnyPromptConfig = 
  | DzinePromptConfig 
  | GptImage1PromptConfig 
  | GptImage2PromptConfig 
  | FluxPromptConfig
  | StableImageUpscalerPromptConfig;

export type AnyPromptObject =
  | GptImage1PromptObject
  | GptImage2PromptObject
  | DzinePromptObject
  | FluxPromptObject
  | StableImageUpscalerPromptObject;

export interface MethodConfig<T extends AnyPromptConfig = AnyPromptConfig> {
  model: string;
  type?: "IMAGE_GENERATOR" | "IMAGE_UPSCALER"; // Defaults to IMAGE_GENERATOR
  inputField?: string; // Defines the input field name (e.g. "prompt" or "imageUrl"). Defaults to "prompt".
  promptObject: T;
}

export const HUMAN_NAME_MAP: Record<string, string> = {
  "gpt-image-1": "GPTImage1",
  "gpt-image-1-mini": "GPTImage1Mini",
  "gpt-image-2": "GPTImage2",
  "black-forest-labs/flux-2-klein-4b": "Flux2-4B",
  "black-forest-labs/flux-2-klein-9b": "Flux2-9B",
  "dzine": "Dzine",
  "upscale": "Upscaled"
};
