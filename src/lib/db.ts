import Dexie, { type Table } from 'dexie';
import { Song } from '../types';

export interface DownloadedSong extends Song {
  id?: number;
  downloadedAt: string;
}

export class MoodifyDatabase extends Dexie {
  downloads!: Table<DownloadedSong>;

  constructor() {
    super('MoodifyDB');
    this.version(1).stores({
      downloads: '++id, title, artist, youtubeUrl'
    });
  }
}

export const db_local = new MoodifyDatabase();
