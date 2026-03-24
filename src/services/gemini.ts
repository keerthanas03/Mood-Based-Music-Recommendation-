import { GoogleGenAI, Type } from "@google/genai";
import { PlaylistResponse, UserProfile } from "../types";

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

export async function getMusicRecommendations(mood: string, userProfile?: UserProfile): Promise<PlaylistResponse> {
  let personalizationPrompt = "";
  if (userProfile) {
    personalizationPrompt = `
    The user's profile indicates:
    - Preferred Moods: ${userProfile.preferredMoods.join(", ")}
    - Liked Genres: ${userProfile.likedGenres.join(", ")}
    Use this information to tailor the recommendations. For example, if they like 'Melody' or 'AR Rahman', prioritize those styles even within the current mood of ${mood}.
    `;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Recommend a list of 7-10 popular Tamil songs (Kollywood) for someone feeling: ${mood}. 
    ${personalizationPrompt}
    Ensure the songs are widely available on Spotify and YouTube.
    Provide a brief description of the vibe and for each song, give the title (in English/Transliterated), artist, duration (in MM:SS format), a short reason why it fits this specific mood, and a direct YouTube link (youtubeUrl) if available.`,
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
                duration: { type: Type.STRING, description: "Duration in MM:SS format" },
                reason: { type: Type.STRING },
                youtubeUrl: { type: Type.STRING, description: "A direct YouTube link for the song" },
              },
              required: ["title", "artist", "reason", "duration"],
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

export async function getLyrics(title: string, artist: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide the lyrics for the Tamil song "${title}" by "${artist}". 
    If the full lyrics are not available, provide a meaningful snippet or a summary of the song's meaning in English and Tamil.
    Format the output with clear line breaks. Do not include any conversational text, just the lyrics or the summary.`,
  });

  return response.text?.trim() || "Lyrics not found.";
}
