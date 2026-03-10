import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PlaylistResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function detectEmotionFromImage(base64Image: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image,
        },
      },
      {
        text: "Analyze the person's facial expression in this image and describe their current mood or emotion in one or two words (e.g., 'Happy', 'Stressed', 'Contemplative', 'Energetic'). Only return the emotion word(s).",
      },
    ],
  });

  return response.text?.trim() || "Neutral";
}

export async function getMusicRecommendations(mood: string): Promise<PlaylistResponse> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Recommend a list of 7-10 popular Tamil songs (Kollywood) for someone feeling: ${mood}. 
    Ensure the songs are widely available on Spotify.
    Provide a brief description of the vibe and for each song, give the title (in English/Transliterated), artist, and a short reason why it fits this specific mood.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mood: { type: Type.STRING },
          description: { type: Type.STRING },
          songs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                album: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ["title", "artist", "reason"],
            },
          },
        },
        required: ["mood", "description", "songs"],
      },
    },
  });

  try {
    return JSON.parse(response.text) as PlaylistResponse;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Could not generate recommendations. Please try again.");
  }
}
