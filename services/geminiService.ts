
import { GoogleGenAI, Type } from "@google/genai";
import type { AIAnalysisResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: 'The ecological impact score from 0 to 100.',
    },
    analysis: {
      type: Type.STRING,
      description: 'A brief summary of the observed ecological changes.',
    },
  },
  required: ['score', 'analysis'],
};

const fileToGenerativePart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
};

export const analyzeEcologicalImpact = async (
  beforeImageBase64: string,
  beforeImageType: string,
  afterImageBase64: string,
  afterImageType: string
): Promise<AIAnalysisResult> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const prompt = `You are an expert ecological data analyst specializing in satellite imagery. Your task is to analyze two images of a specific geographical location: one "before" image showing its initial state, and one "after" image showing its state after a regenerative project.

    Based on a visual comparison, please provide:
    1.  An "Ecological Impact Score" from 0 to 100, where 0 represents negative impact or degradation, 50 represents no change, and 100 represents maximum positive ecological regeneration (e.g., significant reforestation, water body cleanup, soil improvement).
    2.  A brief, one-paragraph "Analysis" summarizing the key positive or negative changes you observe between the two images.
    
    IMPORTANT RULE: If the provided images are not satellite or aerial imagery of a geographical location, or if it's otherwise impossible to perform a meaningful ecological comparison, you MUST return an "Ecological Impact Score" of 0 and explain why in the analysis.

    Analyze the provided images and return the result in the specified JSON format.`;

    const beforeImagePart = fileToGenerativePart(beforeImageBase64, beforeImageType);
    const afterImagePart = fileToGenerativePart(afterImageBase64, afterImageType);

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [beforeImagePart, afterImagePart, { text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
      }
    });

    const resultText = response.text.trim();
    const resultJson = JSON.parse(resultText);
    
    if (typeof resultJson.score === 'number' && typeof resultJson.analysis === 'string') {
      return resultJson as AIAnalysisResult;
    } else {
      throw new Error('Invalid JSON structure in Gemini response');
    }

  } catch (error) {
    console.error("Error analyzing ecological impact:", error);
    throw new Error("Failed to get analysis from AI. Please check the console for more details.");
  }
};
