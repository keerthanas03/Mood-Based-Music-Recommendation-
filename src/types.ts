export interface Song {
  title: string;
  artist: string;
  album?: string;
  reason: string;
  duration: string;
  youtubeUrl?: string;
}

export interface PlaylistResponse {
  mood: string;
  description: string;
  songs: Song[];
}

export interface UserProfile {
  displayName?: string;
  email: string;
  preferredMoods: string[];
  likedGenres: string[];
  lastUpdated: string;
}

export interface HistoryEntry {
  userId: string;
  mood: string;
  timestamp: string;
  recommendations: Song[];
}

export interface SavedPlaylist {
  id?: string;
  userId: string;
  name: string;
  mood: string;
  timestamp: string;
  songs: Song[];
}

export type MoodType = 'Energetic' | 'Relaxed' | 'Melancholic' | 'Focused' | 'Romantic' | 'Adventurous' | 'Happy' | 'Angry' | 'Spiritual' | 'Nostalgic' | 'Party' | 'Epic' | 'Custom';

export type ActivityType = 'Workout' | 'Study' | 'Relax' | 'Commute' | 'Party' | 'Cooking' | 'Driving' | 'Sleeping' | 'Gaming';
