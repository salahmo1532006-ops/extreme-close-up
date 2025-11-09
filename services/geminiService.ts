// FIX: Updated imports to use correct types from the @google/genai SDK.
// FIX: Removed non-exported types `GenerateContentStreamResponse` and `Lro`.
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import type { AspectRatio, VideoAspectRatio } from '../types';
import { fileToBase64 } from '../utils/fileUtils';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

// A type guard to check for the specific error structure from the SDK
interface GoogleGenerativeAIResponseError {
  response?: {
    promptFeedback?: {
      blockReason: string;
      safetyRatings: any[];
    };
  };
}
const isGoogleGenAIResponseError = (error: any): error is GoogleGenerativeAIResponseError => {
    return error && typeof error === 'object' && 'response' in error && error.response && 'promptFeedback' in error.response;
};

export const getThinkingResponse = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
    },
  });
  return response.text;
};

// FIX: Corrected the return type to be inferred as `GenerateContentStreamResponse` is not an exported type.
export const getFastResponseStream = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.models.generateContentStream({
    model: 'gemini-flash-lite-latest',
    contents: prompt,
  });
};

export const getAccurateResponse = async (prompt: string): Promise<GenerateContentResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{googleSearch: {}}],
    },
  });
};

export const analyzeImage = async (prompt: string, imageFile: File): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Image = await fileToBase64(imageFile);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: imageFile.type } },
        { text: prompt },
      ],
    },
  });
  return response.text;
};

// FIX: Added missing editImage function for ImageEditor and ImageCompositor components.
export const editImage = async (prompt: string, baseImageFile: File, detailImageFile?: File): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
      const parts: any[] = [];
      const base64Base = await fileToBase64(baseImageFile);
      parts.push({ inlineData: { data: base64Base, mimeType: baseImageFile.type } });

      if (detailImageFile) {
        const base64Detail = await fileToBase64(detailImageFile);
        parts.push({ inlineData: { data: base64Detail, mimeType: detailImageFile.type } });
      }

      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { responseModalities: [Modality.IMAGE] },
      });
      
      if (response.promptFeedback?.blockReason) {
        throw new Error(`Request blocked. Reason: ${response.promptFeedback.blockReason}.`);
      }

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }

      throw new Error('The model returned no image content.');
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(`Image editing/composition failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred during image processing.');
  }
};

export const generateEnhancedImage = async (
  prompt: string, 
  aspectRatio: AspectRatio, 
  baseImageFile?: File, 
  detailImageFile?: File
): Promise<{ imageUrl: string; fallbackUsed: boolean; }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let primaryFailureReason = "An unknown error occurred with the primary model.";

  // Editing / Composition with Gemini 2.5 Flash Image
  if (baseImageFile) {
    try {
      const parts: any[] = [];
      const base64Base = await fileToBase64(baseImageFile);
      parts.push({ inlineData: { data: base64Base, mimeType: baseImageFile.type } });

      if (detailImageFile) {
        const base64Detail = await fileToBase64(detailImageFile);
        parts.push({ inlineData: { data: base64Detail, mimeType: detailImageFile.type } });
      }

      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { responseModalities: [Modality.IMAGE] },
      });

      if (response.promptFeedback?.blockReason) {
        throw new Error(`Request blocked. Reason: ${response.promptFeedback.blockReason}.`);
      }
      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
          return {
            imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
            fallbackUsed: false // Not a fallback in this context, direct use.
          };
        }
      }
      throw new Error('The model returned no image content.');
    } catch (error) {
       if (error instanceof Error) {
        throw new Error(`Image editing/composition failed: ${error.message}`);
      }
      throw new Error('An unknown error occurred during image processing.');
    }
  }

  // --- Primary Text-to-Image Attempt (Imagen) ---
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio,
        },
    });
    
    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return { imageUrl: `data:image/png;base64,${base64ImageBytes}`, fallbackUsed: false };
    } else {
      primaryFailureReason = "The model returned no image content.";
    }
  } catch (error) {
    console.warn("Imagen 4.0 failed, proceeding to fallback.", error);
    if (isGoogleGenAIResponseError(error)) {
      primaryFailureReason = `Request was blocked. Reason: ${error.response?.promptFeedback?.blockReason}.`;
    } else if (error instanceof Error) {
      primaryFailureReason = error.message;
    }
  }

  // --- Fallback Text-to-Image Attempt (Gemini Flash Image) ---
  console.warn(`Primary model failed: ${primaryFailureReason}. Attempting fallback...`);
  try {
    const fallbackPrompt = `Generate an image with an aspect ratio of ${aspectRatio}. ${prompt}`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: fallbackPrompt }] },
      config: { responseModalities: [Modality.IMAGE] },
    });

    if (response.promptFeedback?.blockReason) {
      throw new Error(`Request was blocked. Reason: ${response.promptFeedback.blockReason}.`);
    }

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        return {
          imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          fallbackUsed: true
        };
      }
    }
    
    throw new Error('The model returned no image content.');
  } catch (fallbackError) {
    const fallbackFailureReason = fallbackError instanceof Error ? fallbackError.message : 'An unknown error occurred.';
    throw new Error(`Generation Failed.\n- Primary Model: ${primaryFailureReason}\n- Fallback Model: ${fallbackFailureReason}`);
  }
};


const loadingMessages = [
    "Summoning digital muses...",
    "Painting with pixels and light...",
    "Warming up the quantum renderer...",
    "Teaching photons to dance...",
    "Finalizing temporal masterpiece...",
    "Reticulating splines...",
    "Compressing reality stream...",
];

export const generateVideoFromImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string,
  aspectRatio: VideoAspectRatio,
  onProgress: (message: string) => void
): Promise<Blob> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // FIX: Corrected the type of the operation to be inferred as `Lro` is not an exported type.
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    image: {
      imageBytes: base64Image,
      mimeType: mimeType,
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio,
    }
  });

  let messageIndex = 0;
  const updateProgress = () => {
    onProgress(loadingMessages[messageIndex % loadingMessages.length]);
    messageIndex++;
  };
  
  updateProgress();

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    updateProgress();
    operation = await ai.operations.getVideosOperation({ operation });
  }

  onProgress("Finalizing video...");
  
  // FIX: Removed incorrect type assertion. `operation.response` is already correctly typed.
  const result = operation.response;
  const downloadLink = result?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error('Video generation failed or returned no URI.');
  }

  onProgress("Downloading video...");
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }

  return response.blob();
};

const VDP_SYSTEM_INSTRUCTION = `You are my Virtual Director of Photography (DP). Your one and only task is to help me enhance my image prompts.

I will give you a shot description. You will analyze its core intent (e.g., is it about power? intimacy? scale?) and then select the single best "lens package" from the list below to maximize its dramatic impact.

Phase 1B: Historical Entity Research (RAG)
During your analysis, you must identify all "researchable entities." These are specific people, places, or objects from a distinct historical era (e.g., "1880s pioneer," "Roman centurion," "1920s flapper," "Viking longship"). When you find a researchable entity, you must use the Google Search tool to "boost your knowledge." Your search goal is to find specific, descriptive visual details about clothing, appearance, and common objects from that era. You will then synthesize these details and add them as keywords to your final enhanced prompt to ensure the generation is historically accurate.

Your Virtual Lens Kit
You must choose one primary concept from this list for each shot:

Anamorphic Lens: Select this for "epic," "cinematic," "blockbuster" scale, or wide landscape shots. This is your go-to for a "film" look.

Macro Lens: Select this for "intimate," "textured," or "extreme detail" shots. Use this when the prompt mentions tiny details like pores, sweat, fibers, or veins.

85mm Portrait Lens: Select this for "heroic," "emotional," or "isolating" facial close-ups. This is for focusing on a character's emotion (like a defiant eye-lock) and melting the background.

Wide-Angle Lens (24mm): Select this for "power," "dominance," or "imposing" shots. It's best paired with low angles to make the subject look powerful and larger-than-life.

Your Task & Format
When I provide my prompt, you will respond in this exact format:

Analysis: (A 1-sentence analysis of my prompt's core intent).
Lens Selection: (The single lens you chose from the kit).
Reason: (A 1-sentence justification for your choice).
Enhanced Prompt: (You will then rewrite my original prompt, seamlessly adding your lens choice AND any researched historical details, along with associated keywords like "shallow DOF," "bokeh," or "distortion," to the beginning of the text).`;

export const getVDPResponse = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      systemInstruction: VDP_SYSTEM_INSTRUCTION,
      tools: [{googleSearch: {}}],
    }
  });
  return response.text;
};
