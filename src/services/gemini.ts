import { GoogleGenAI, Type } from "@google/genai";
import { PlaylistResponse, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function safeGenerateContent(params: any, errorMessage: string): Promise<any> {
  try {
    const response = await ai.models.generateContent(params);
    return response;
  } catch (error: any) {
    console.error(`Gemini API Error [${params.model}]:`, {
      message: error.message,
      stack: error.stack,
      params: JSON.stringify(params, null, 2)
    });
    
    if (error.message?.includes('quota')) {
      throw new Error("API quota exceeded. Please try again later.");
    }
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error("Network error. Please check your internet connection.");
    }
    
    throw new Error(errorMessage);
  }
}

export async function detectEmotionFromImage(base64Image: string): Promise<string> {
  const response = await safeGenerateContent({
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
  }, "Could not read your expression. Try again?");

  return response.text?.trim() || "Neutral";
}

export async function getMusicRecommendations(mood: string, userProfile?: UserProfile, activity?: string): Promise<PlaylistResponse> {
  let personalizationPrompt = "";
  if (userProfile) {
    personalizationPrompt = `
    The user's profile indicates:
    - Preferred Moods: ${userProfile.preferredMoods.join(", ")}
    - Liked Genres: ${userProfile.likedGenres.join(", ")}
    Use this information to tailor the recommendations. For example, if they like 'Melody' or 'AR Rahman', prioritize those styles even within the current context.
    `;
  }

  const context = activity ? `activity: ${activity} and mood: ${mood}` : `mood: ${mood}`;

  const response = await safeGenerateContent({
    model: "gemini-3-flash-preview",
    contents: `Recommend a list of 7-10 popular Tamil songs (Kollywood) for someone in the following context: ${context}. 
    ${personalizationPrompt}
    For each song, you MUST provide:
    1. title: The song title (English/Transliterated)
    2. artist: The singer/composer
    3. album: The movie name
    4. duration: Duration in MM:SS
    5. reason: Why it fits the ${activity ? 'activity and mood' : 'mood'}
    6. youtubeUrl: A direct, valid YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID). This is CRITICAL for the app's player to work. Search your knowledge for the most popular official video or lyrical video link for each song.`,
    config: {
      tools: [{ googleSearch: {} }],
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
              required: ["title", "artist", "reason", "duration", "youtubeUrl"],
            },
          },
        },
        required: ["mood", "description", "songs"],
      },
    },
  }, "Could not generate recommendations. Please try again.");

  try {
    return JSON.parse(response.text) as PlaylistResponse;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Received an invalid response from the AI. Please try again.");
  }
}

export async function getLyrics(title: string, artist: string): Promise<string> {
  const response = await safeGenerateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide the full lyrics for the Tamil song "${title}" by "${artist}". 
    Please provide:
    1. The lyrics in Tamil script.
    2. The transliterated lyrics in English (Romanized Tamil).
    3. A brief English summary of the song's meaning.
    
    Format the output beautifully with clear section headers (e.g., [Tamil], [Transliteration], [Meaning]). 
    Use clear line breaks between verses. Do not include any conversational text or introductory remarks.`,
  }, "Lyrics not found.");

  return response.text?.trim() || "Lyrics not found.";
}

export async function searchSongs(query: string): Promise<PlaylistResponse> {
  const response = await safeGenerateContent({
    model: "gemini-3-flash-preview",
    contents: `Search for Tamil songs related to: "${query}". 
    Provide a list of 5-8 relevant songs.
    For each song, you MUST provide:
    1. title: The song title (English/Transliterated)
    2. artist: The singer/composer
    3. album: The movie name
    4. duration: Duration in MM:SS
    5. reason: Why this song matches the search query
    6. youtubeUrl: A direct, valid YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID). Search your knowledge for the most popular official video or lyrical video link for each song.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mood: { type: Type.STRING, description: "The search query or a summary of search results" },
          description: { type: Type.STRING, description: "A brief description of the search results" },
          songs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                album: { type: Type.STRING },
                duration: { type: Type.STRING },
                reason: { type: Type.STRING },
                youtubeUrl: { type: Type.STRING },
              },
              required: ["title", "artist", "reason", "duration", "youtubeUrl"],
            },
          },
        },
        required: ["mood", "description", "songs"],
      },
    },
  }, "Could not find any songs matching your search. Please try again.");

  try {
    return JSON.parse(response.text) as PlaylistResponse;
  } catch (error) {
    console.error("Failed to parse Gemini search response:", error);
    throw new Error("Received an invalid response from the AI. Please try again.");
  }
}
