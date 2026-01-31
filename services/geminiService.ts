import { GoogleGenAI, Type } from "@google/genai";
import { WordItem } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateWordList = async (category: string): Promise<WordItem[]> => {
  if (!apiKey) {
    // Fallback for demo if no key provided
    return [
      { word: "CAT", sentence: "The cat says meow." },
      { word: "DOG", sentence: "The dog runs fast." },
      { word: "SUN", sentence: "The sun is hot." }
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a list of 5 simple, distinct English words related to the category "${category}" for a 3-year-old toddler. 
      The words should be 3-5 letters long. 
      Include a very short, simple sentence for each.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING, description: "The word in UPPERCASE" },
              sentence: { type: Type.STRING, description: "A simple sentence using the word" }
            },
            required: ["word", "sentence"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as WordItem[];
  } catch (error) {
    console.error("Failed to generate words:", error);
    return [{ word: "APPLE", sentence: "A red apple." }];
  }
};

export const generateImageForWord = async (word: string): Promise<string | null> => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: `Draw a cute, simple, flat vector illustration of a ${word}. Solid pastel background. Minimalist style for kids.`,
      config: {
        // No responseMimeType for image model
      }
    });
    
    // Iterate through parts to find the image
    const candidates = response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to generate image:", error);
    return null;
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  if (!apiKey || !text.trim()) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'] as any, // Use string to avoid enum issues, cast to any to bypass strict type check if needed
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // 'Puck' sounds friendly/child-like often
          },
        },
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
        const audioPart = candidates[0].content.parts[0];
        if (audioPart.inlineData?.data) {
            return audioPart.inlineData.data;
        }
    }
    return null;
  } catch (error) {
    console.error("Failed to generate speech:", error);
    return null;
  }
};
