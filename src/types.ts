export interface Song {
  title: string;
  artist: string;
  album?: string;
  reason: string;
}

export interface PlaylistResponse {
  mood: string;
  description: string;
  songs: Song[];
}

export type MoodType = 'Energetic' | 'Relaxed' | 'Melancholic' | 'Focused' | 'Romantic' | 'Adventurous' | 'Happy' | 'Angry' | 'Spiritual' | 'Nostalgic' | 'Party' | 'Epic' | 'Custom';
