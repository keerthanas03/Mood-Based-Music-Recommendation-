import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Sparkles, 
  Search, 
  Play, 
  ExternalLink, 
  RefreshCw, 
  Heart, 
  Zap, 
  Coffee, 
  CloudRain, 
  Target, 
  Compass,
  Camera,
  Palette,
  Share2,
  Check,
  Sun,
  Flame,
  Moon,
  History,
  Music2,
  Crown
} from 'lucide-react';
import { getMusicRecommendations, detectEmotionFromImage } from './services/gemini';
import { Song, PlaylistResponse, MoodType } from './types';
import CameraCapture from './components/CameraCapture';

interface Theme {
  id: string;
  name: string;
  colors: {
    bg: string;
    primary: string;
    secondary: string;
    glow: string;
    text: string;
    textSecondary: string;
    glassBg: string;
    glassBorder: string;
  };
}

const THEMES: Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    colors: { 
      bg: '#0a0502', primary: '#ff4e00', secondary: '#4a103a', glow: '#3a1510', 
      text: '#ffffff', textSecondary: 'rgba(255, 255, 255, 0.6)', glassBg: 'rgba(255, 255, 255, 0.05)', glassBorder: 'rgba(255, 255, 255, 0.1)' 
    }
  },
  {
    id: 'daylight',
    name: 'Daylight',
    colors: { 
      bg: '#f8f9fa', primary: '#ff8800', secondary: '#ffcc00', glow: '#fff4e0', 
      text: '#1a1a1a', textSecondary: 'rgba(0, 0, 0, 0.6)', glassBg: 'rgba(0, 0, 0, 0.05)', glassBorder: 'rgba(0, 0, 0, 0.1)' 
    }
  },
  {
    id: 'lavender',
    name: 'Lavender',
    colors: { 
      bg: '#f3f0f7', primary: '#9d50bb', secondary: '#6e48aa', glow: '#e8e1f0', 
      text: '#2d1b4d', textSecondary: 'rgba(45, 27, 77, 0.6)', glassBg: 'rgba(157, 80, 187, 0.05)', glassBorder: 'rgba(157, 80, 187, 0.1)' 
    }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: { 
      bg: '#020a0f', primary: '#00d4ff', secondary: '#004e92', glow: '#002c4a', 
      text: '#ffffff', textSecondary: 'rgba(255, 255, 255, 0.6)', glassBg: 'rgba(255, 255, 255, 0.05)', glassBorder: 'rgba(255, 255, 255, 0.1)' 
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: { 
      bg: '#050a02', primary: '#00ff88', secondary: '#004d2a', glow: '#0a2a05', 
      text: '#ffffff', textSecondary: 'rgba(255, 255, 255, 0.6)', glassBg: 'rgba(255, 255, 255, 0.05)', glassBorder: 'rgba(255, 255, 255, 0.1)' 
    }
  }
];

const MOODS: { type: MoodType; icon: React.ReactNode; color: string }[] = [
  { type: 'Energetic', icon: <Zap size={20} />, color: 'from-yellow-400 to-orange-500' },
  { type: 'Relaxed', icon: <Coffee size={20} />, color: 'from-emerald-400 to-teal-500' },
  { type: 'Melancholic', icon: <CloudRain size={20} />, color: 'from-blue-400 to-indigo-500' },
  { type: 'Focused', icon: <Target size={20} />, color: 'from-purple-400 to-pink-500' },
  { type: 'Romantic', icon: <Heart size={20} />, color: 'from-rose-400 to-red-500' },
  { type: 'Adventurous', icon: <Compass size={20} />, color: 'from-cyan-400 to-blue-500' },
  { type: 'Happy', icon: <Sun size={20} />, color: 'from-amber-300 to-yellow-500' },
  { type: 'Angry', icon: <Flame size={20} />, color: 'from-red-600 to-orange-700' },
  { type: 'Spiritual', icon: <Moon size={20} />, color: 'from-indigo-600 to-purple-900' },
  { type: 'Nostalgic', icon: <History size={20} />, color: 'from-stone-400 to-slate-600' },
  { type: 'Party', icon: <Music2 size={20} />, color: 'from-fuchsia-500 to-purple-600' },
  { type: 'Epic', icon: <Crown size={20} />, color: 'from-yellow-600 to-amber-800' },
];

export default function App() {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [customMood, setCustomMood] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const loadingMessages = [
    "Analyzing your vibe...",
    "Scanning the Kollywood archives...",
    "Matching rhythms to your mood...",
    "Curating your personalized sonic journey...",
    "Finding the perfect melody for this moment...",
    "Tuning into your frequency...",
    "Selecting hand-picked Kollywood hits..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('moodify_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('moodify_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in the custom mood input
      if (document.activeElement?.tagName === 'INPUT') return;
      
      if (e.key.toLowerCase() === 'c' && !isCameraOpen && !isLoading) {
        setIsCameraOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCameraOpen, isLoading]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-color', currentTheme.colors.bg);
    root.style.setProperty('--accent-primary', currentTheme.colors.primary);
    root.style.setProperty('--accent-secondary', currentTheme.colors.secondary);
    root.style.setProperty('--glow-color', currentTheme.colors.glow);
    root.style.setProperty('--text-primary', currentTheme.colors.text);
    root.style.setProperty('--text-secondary', currentTheme.colors.textSecondary);
    root.style.setProperty('--glass-bg', currentTheme.colors.glassBg);
    root.style.setProperty('--glass-border', currentTheme.colors.glassBorder);
  }, [currentTheme]);

  const toggleFavorite = (song: Song) => {
    setFavorites(prev => {
      const exists = prev.find(s => s.title === song.title && s.artist === song.artist);
      if (exists) {
        return prev.filter(s => s.title !== song.title || s.artist !== song.artist);
      }
      return [...prev, song];
    });
  };

  const isFavorite = (song: Song) => {
    return favorites.some(s => s.title === song.title && s.artist === song.artist);
  };

  const handleShare = () => {
    if (!playlist) return;
    const songList = playlist.songs.map((s, i) => `${i + 1}. ${s.title} - ${s.artist}`).join('\n');
    const text = `Mood: ${playlist.mood}\n\nRecommended Tamil Songs:\n${songList}\n\nGenerated by Moodify Tamil`;
    navigator.clipboard.writeText(text);
    setIsShared(true);
    setTimeout(() => setIsShared(false), 2000);
  };

  const handleGenerate = async (moodToUse: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMusicRecommendations(moodToUse);
      setPlaylist(result);
    } catch (err) {
      setError('Failed to find the right vibes. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoodClick = (mood: MoodType) => {
    setSelectedMood(mood);
    handleGenerate(mood);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMood.trim()) {
      handleGenerate(customMood);
    }
  };

  const handleCameraCapture = async (base64: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const detectedMood = await detectEmotionFromImage(base64);
      setCustomMood(detectedMood);
      setIsCameraOpen(false);
      await handleGenerate(detectedMood);
    } catch (err) {
      setError('Could not read your expression. Try again?');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen font-sans">
      <div className="noise" />
      <div className="atmosphere" />
      
      <main className="max-w-5xl mx-auto px-6 py-12 md:py-24 relative z-10">
        {/* Top Controls */}
        <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`p-3 rounded-full glass transition-all ${
              showFavorites ? 'text-orange-400 bg-white/10' : 'text-white/70 hover:text-white'
            }`}
            title="Favorites"
          >
            <Heart size={20} fill={showFavorites ? "currentColor" : "none"} />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="p-3 rounded-full glass text-white/70 hover:text-white transition-all"
              title="Change Theme"
            >
              <Palette size={20} />
            </button>
            
            <AnimatePresence>
              {isThemeMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 glass rounded-2xl overflow-hidden shadow-2xl"
                >
                  <div className="p-2 space-y-1">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          setCurrentTheme(theme);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                          currentTheme.id === theme.id ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5'
                        }`}
                      >
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ background: `linear-gradient(to bottom right, ${theme.colors.primary}, ${theme.colors.secondary})` }}
                        />
                        <span className="text-sm font-medium">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Header */}
        <header className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-[10px] font-mono uppercase tracking-[0.2em] text-orange-400 mb-8 float">
              <Sparkles size={12} />
              AI Powered Recommendations
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black mb-8 tracking-tighter leading-none" style={{ color: 'var(--text-primary)' }}>
              Mood<span className="italic text-gradient">ify</span> <span className="text-xl md:text-2xl align-top text-orange-400/30 font-sans font-light tracking-widest">TAMIL</span>
            </h1>
            <p className="text-xl max-w-2xl mx-auto font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              The ultimate soundtrack for your soul. Tell us how you feel, and we'll find the perfect Kollywood hits for your moment.
            </p>
          </motion.div>
        </header>

        {/* Favorites View */}
        <AnimatePresence>
          {showFavorites && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <div className="glass p-8 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
                    <Heart size={20} className="text-rose-400" fill="currentColor" />
                    Your Favorites
                  </h2>
                  <button onClick={() => setShowFavorites(false)} className="text-sm text-white/40 hover:text-white">Close</button>
                </div>
                
                {favorites.length === 0 ? (
                  <p className="text-center py-10 text-white/30 italic">No favorites yet. Heart some songs to see them here!</p>
                ) : (
                  <div className="grid gap-3">
                    {favorites.map((song, index) => (
                      <div key={`fav-${index}`} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{song.title}</h4>
                          <p className="text-xs text-white/40 truncate">{song.artist}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleFavorite(song)} className="text-rose-400">
                            <Heart size={16} fill="currentColor" />
                          </button>
                          <a
                            href={`https://open.spotify.com/search/${encodeURIComponent(`${song.title} ${song.artist}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/30 hover:text-white"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Mood Selection */}
        <section className="mb-20">
          <div className="bento-grid mb-12">
            {MOODS.map((mood, index) => (
              <motion.button
                key={mood.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMoodClick(mood.type)}
                disabled={isLoading}
                className={`flex flex-col items-center justify-center p-8 glass-card group ${
                  selectedMood === mood.type ? 'ring-2 ring-orange-500/50 bg-white/10' : ''
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mood.color} flex items-center justify-center mb-4 shadow-2xl group-hover:shadow-orange-500/40 transition-all duration-500 group-hover:rotate-6`}>
                  {mood.icon}
                </div>
                <span className="text-sm font-semibold tracking-wide uppercase opacity-80 group-hover:opacity-100">{mood.type}</span>
              </motion.button>
            ))}
          </div>

          <form onSubmit={handleCustomSubmit} className="relative max-w-2xl mx-auto flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <input
                type="text"
                value={customMood}
                onChange={(e) => setCustomMood(e.target.value)}
                placeholder="Describe your vibe..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-white/20 text-lg"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-orange-400 transition-colors" size={24} />
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                disabled={isCameraOpen || isLoading}
                className="p-5 rounded-2xl glass-card text-orange-400 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Scan Mood via Camera (C)"
              >
                {isCameraOpen ? <RefreshCw className="animate-spin" size={24} /> : <Camera size={24} />}
              </button>

              <button
                type="submit"
                disabled={isLoading || !customMood.trim()}
                className="flex-1 md:flex-none bg-white text-black px-10 rounded-2xl font-bold hover:bg-orange-500 hover:text-white transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-orange-500/20"
              >
                {isLoading ? <RefreshCw className="animate-spin" size={20} /> : 'FIND VIBE'}
              </button>
            </div>
          </form>
        </section>

        <AnimatePresence>
          {isCameraOpen && (
            <CameraCapture 
              onCapture={handleCameraCapture} 
              onClose={() => setIsCameraOpen(false)}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative w-20 h-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-orange-500/20 border-t-orange-500 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music className="text-orange-500 animate-pulse" size={32} />
                </div>
              </div>
              <p className="mt-6 text-white/50 font-mono text-sm animate-pulse">
                {loadingMessages[loadingMessageIndex]}
              </p>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-10 text-rose-400 bg-rose-400/10 rounded-2xl border border-rose-400/20"
            >
              {error}
            </motion.div>
          )}

          {playlist && !isLoading && (
            <motion.div
              key="playlist"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="glass-card p-10 relative overflow-hidden mb-12">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
                  <Music size={200} />
                </div>
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="inline-block px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-mono uppercase tracking-widest mb-4">
                      Current Mood
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif font-black mb-4 tracking-tight">Feeling {playlist.mood}</h2>
                    <p className="text-white/60 italic text-lg leading-relaxed max-w-2xl">{playlist.description}</p>
                  </div>
                  <button
                    onClick={handleShare}
                    className="p-4 rounded-2xl glass-card text-white/50 hover:text-white transition-all flex items-center gap-3 group"
                  >
                    {isShared ? <Check size={20} className="text-emerald-400" /> : <Share2 size={20} className="group-hover:rotate-12 transition-transform" />}
                    <span className="text-xs font-mono uppercase tracking-widest font-bold">{isShared ? 'Copied' : 'Share Playlist'}</span>
                  </button>
                </div>
              </div>

              <div className="grid gap-6">
                {playlist.songs.map((song, index) => (
                  <motion.div
                    key={`${song.title}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                    className="glass-card p-6 flex items-center gap-6 group cursor-default"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 font-serif text-2xl font-black group-hover:bg-orange-500/20 group-hover:text-orange-400 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xl truncate group-hover:text-orange-400 transition-colors">{song.title}</h3>
                      <p className="text-white/50 text-sm font-medium truncate mb-2">{song.artist} {song.album ? `• ${song.album}` : ''}</p>
                      <div className="flex items-center gap-2 text-white/30 text-xs italic">
                        <Sparkles size={12} className="text-orange-400/50" />
                        <p className="line-clamp-1">{song.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleFavorite(song)}
                        className={`p-3 rounded-xl hover:bg-white/10 transition-all ${
                          isFavorite(song) ? 'text-rose-400 bg-rose-400/10' : 'text-white/20'
                        }`}
                        title={isFavorite(song) ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Heart size={20} fill={isFavorite(song) ? "currentColor" : "none"} />
                      </button>
                      <div className="h-8 w-[1px] bg-white/10 mx-1" />
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.title} ${song.artist}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl hover:bg-white/10 text-white/20 hover:text-white transition-all hover:scale-110"
                        title="Search on YouTube"
                      >
                        <Play size={20} />
                      </a>
                      <a
                        href={`https://open.spotify.com/search/${encodeURIComponent(`${song.title} ${song.artist}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl hover:bg-white/10 text-white/20 hover:text-white transition-all hover:scale-110"
                        title="Search on Spotify"
                      >
                        <ExternalLink size={20} />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="text-center pt-8">
                <button
                  onClick={() => handleGenerate(playlist.mood)}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
                >
                  <RefreshCw size={16} />
                  Refresh Recommendations
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-12 text-center text-white/20 text-xs font-mono uppercase tracking-widest border-t border-white/5">
        Moodify &copy; {new Date().getFullYear()} • Powered by Gemini AI
      </footer>
    </div>
  );
}
