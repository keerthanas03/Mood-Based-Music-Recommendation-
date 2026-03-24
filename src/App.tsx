import React, { useState, useEffect, useRef } from 'react';
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
  Crown,
  User,
  LogOut,
  Settings,
  UserCircle,
  ChevronDown,
  X,
  Clock,
  Volume2,
  Volume1,
  VolumeX,
  SkipBack,
  SkipForward,
  Pause,
  Quote
} from 'lucide-react';
import { getMusicRecommendations, detectEmotionFromImage, getLyrics } from './services/gemini';
import ReactPlayer from 'react-player';
import { Song, PlaylistResponse, MoodType, UserProfile, HistoryEntry } from './types';
import CameraCapture from './components/CameraCapture';
import { auth, db, signIn, logout, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, collection, addDoc, query, where, orderBy, limit } from 'firebase/firestore';

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

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; errorInfo: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0502] text-white font-sans">
          <div className="glass-card p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <X size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-white/50 text-sm mb-6 leading-relaxed">
              We encountered an unexpected error. This might be due to a connection issue or a temporary glitch.
            </p>
            {this.state.errorInfo && (
              <div className="bg-black/40 p-4 rounded-xl mb-6 text-left overflow-hidden">
                <p className="text-[10px] font-mono text-rose-400/70 break-all line-clamp-3">
                  {this.state.errorInfo}
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-orange-500 hover:text-white transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
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
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<any>(null);
  const Player = ReactPlayer as any;
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setHistory([]);
      return;
    }

    // Listen to user profile
    const profileRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        // Create default profile
        const defaultProfile: UserProfile = {
          email: user.email || '',
          displayName: user.displayName || '',
          preferredMoods: [],
          likedGenres: [],
          lastUpdated: new Date().toISOString()
        };
        setDoc(profileRef, defaultProfile).catch(e => handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}`));
      }
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${user.uid}`));

    // Listen to history
    const historyRef = collection(db, 'history');
    const historyQuery = query(
      historyRef,
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as HistoryEntry));
      setHistory(historyData);
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'history'));

    return () => {
      unsubscribeProfile();
      unsubscribeHistory();
    };
  }, [user]);

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

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const handleShowLyrics = async () => {
    if (!currentSong) return;
    setShowLyrics(true);
    setIsLyricsLoading(true);
    setLyrics(null);
    try {
      const fetchedLyrics = await getLyrics(currentSong.title, currentSong.artist);
      setLyrics(fetchedLyrics);
    } catch (error) {
      console.error("Failed to fetch lyrics:", error);
      setLyrics("Could not load lyrics. Please try again later.");
    } finally {
      setIsLyricsLoading(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    setPlayed(percent);
    playerRef.current?.seekTo(percent);
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
      const result = await getMusicRecommendations(moodToUse, userProfile || undefined);
      setPlaylist(result);
      
      // Save to history if user is logged in
      if (user) {
        const historyEntry: Omit<HistoryEntry, 'id'> = {
          userId: user.uid,
          mood: moodToUse,
          timestamp: new Date().toISOString(),
          recommendations: result.songs
        };
        await addDoc(collection(db, 'history'), historyEntry).catch(e => 
          handleFirestoreError(e, OperationType.CREATE, 'history')
        );
      }
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

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) return;
    const profileRef = doc(db, 'users', user.uid);
    const updatedProfile = {
      ...userProfile,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    try {
      await setDoc(profileRef, updatedProfile);
      setIsProfileModalOpen(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
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
    <ErrorBoundary>
      <div className="relative min-h-screen font-sans">
      <div className="noise" />
      <div className="atmosphere" />
      
      <main className="max-w-5xl mx-auto px-6 py-12 md:py-24 relative z-10">
        {/* Top Controls */}
        <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
          {isAuthReady && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`p-3 rounded-full glass transition-all ${
                      showHistory ? 'text-orange-400 bg-white/10' : 'text-white/70 hover:text-white'
                    }`}
                    title="History"
                  >
                    <History size={20} />
                  </button>
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="p-3 rounded-full glass text-white/70 hover:text-white transition-all"
                    title="Profile"
                  >
                    <UserCircle size={20} />
                  </button>
                  <button
                    onClick={logout}
                    className="p-3 rounded-full glass text-white/70 hover:text-rose-400 transition-all"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={signIn}
                  className="px-4 py-2 rounded-full glass text-white/70 hover:text-white transition-all flex items-center gap-2 text-sm font-medium"
                >
                  <User size={18} />
                  Login
                </button>
              )}
            </>
          )}
          
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
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <h3 className="font-bold text-xl truncate group-hover:text-orange-400 transition-colors">{song.title}</h3>
                        <span className="text-white/30 text-xs font-mono shrink-0">{song.duration}</span>
                      </div>
                      <p className="text-white/50 text-sm font-medium truncate mb-2">{song.artist} {song.album ? `• ${song.album}` : ''}</p>
                      <div className="flex items-center gap-2 text-white/30 text-xs italic">
                        <Sparkles size={12} className="text-orange-400/50" />
                        <p className="line-clamp-1">{song.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setCurrentSong(song);
                          setIsPlaying(true);
                        }}
                        className={`p-3 rounded-xl transition-all ${
                          currentSong?.title === song.title ? 'bg-orange-500 text-white' : 'hover:bg-white/10 text-white/20 hover:text-white'
                        }`}
                        title="Play in Moodify"
                      >
                        <Play size={20} fill={currentSong?.title === song.title ? "currentColor" : "none"} />
                      </button>
                      <div className="h-8 w-[1px] bg-white/10 mx-1" />
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

      <AnimatePresence>
        {isProfileModalOpen && userProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass-card p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-400">
                    <User size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">User Profile</h2>
                    <p className="text-white/40 text-sm font-mono uppercase tracking-wider">Personalize your journey</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-white/30 mb-3">Preferred Moods</label>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.type}
                        onClick={() => {
                          const current = userProfile.preferredMoods;
                          const updated = current.includes(mood.type)
                            ? current.filter(m => m !== mood.type)
                            : [...current, mood.type];
                          handleUpdateProfile({ preferredMoods: updated });
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                          userProfile.preferredMoods.includes(mood.type)
                            ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {mood.type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-white/30 mb-3">Liked Genres</label>
                  <div className="flex flex-wrap gap-2">
                    {['Melody', 'Folk', 'Rock', 'Jazz', 'Classical', 'Hip Hop', 'EDM', 'Gana'].map((genre) => (
                      <button
                        key={genre}
                        onClick={() => {
                          const current = userProfile.likedGenres;
                          const updated = current.includes(genre)
                            ? current.filter(g => g !== genre)
                            : [...current, genre];
                          handleUpdateProfile({ likedGenres: updated });
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                          userProfile.likedGenres.includes(genre)
                            ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-white/30 font-mono">
                    <span>Email: {userProfile.email}</span>
                    <span>Last Updated: {new Date(userProfile.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass-card p-8 overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-8 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-400">
                    <History size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Listening History</h2>
                    <p className="text-white/40 text-sm font-mono uppercase tracking-wider">Your sonic journey</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="text-center py-20 text-white/20 italic">
                    No history yet. Start exploring!
                  </div>
                ) : (
                  history.map((entry, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-widest">
                            {entry.mood}
                          </span>
                          <div className="flex items-center gap-1.5 text-white/30 text-xs font-mono">
                            <Clock size={12} />
                            {new Date(entry.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleGenerate(entry.mood)}
                          className="text-white/20 hover:text-white transition-all"
                          title="Re-generate"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {entry.recommendations.slice(0, 4).map((song, j) => (
                          <div key={j} className="flex items-center gap-3 text-sm group/song">
                            <button 
                              onClick={() => {
                                setCurrentSong(song);
                                setIsPlaying(true);
                                setShowHistory(false);
                              }}
                              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/20 group-hover/song:bg-orange-500 group-hover/song:text-white transition-all"
                            >
                              <Play size={12} fill="currentColor" className="hidden group-hover/song:block" />
                              <span className="group-hover/song:hidden">{j + 1}</span>
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-bold truncate">{song.title}</p>
                                <span className="text-[10px] text-white/20 font-mono shrink-0">{song.duration}</span>
                              </div>
                              <p className="text-white/40 text-xs truncate">{song.artist}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLyrics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                    <Quote size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{currentSong?.title}</h3>
                    <p className="text-white/40 text-xs">{currentSong?.artist}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLyrics(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {isLyricsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <RefreshCw size={32} className="text-orange-400 animate-spin" />
                    <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Fetching lyrics...</p>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-lg leading-relaxed text-white/80 font-serif italic text-center">
                    {lyrics}
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-white/10 bg-white/5 text-center">
                <p className="text-[10px] text-white/20 font-mono uppercase tracking-widest">
                  Lyrics provided by Gemini AI
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentSong && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[150] p-4 md:p-6"
          >
            <div className="max-w-5xl mx-auto glass-card p-4 flex items-center justify-between gap-6 shadow-2xl border-white/20">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                  <Music size={24} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">{currentSong.title}</h4>
                  <p className="text-white/40 text-xs truncate">{currentSong.artist}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="hidden">
                  {Player && (
                    <Player
                      ref={playerRef}
                      url={currentSong.youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${currentSong.title} ${currentSong.artist}`)}`}
                      playing={isPlaying}
                      volume={isMuted ? 0 : volume}
                      onProgress={(state: any) => setPlayed(state.played)}
                      onDuration={(d: any) => setDuration(d)}
                      onEnded={() => {
                        setIsPlaying(false);
                        setPlayed(0);
                      }}
                      width="0"
                      height="0"
                    />
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <button className="text-white/30 hover:text-white transition-colors">
                    <SkipBack size={20} />
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                  </button>
                  <button className="text-white/30 hover:text-white transition-colors">
                    <SkipForward size={20} />
                  </button>
                </div>
                <div className="w-full flex items-center gap-3">
                  <span className="text-[10px] font-mono text-white/30 w-8 text-right">{formatTime(played * duration)}</span>
                  <div 
                    className="flex-1 h-1 bg-white/10 rounded-full relative group/progress cursor-pointer"
                    onClick={handleSeek}
                  >
                    <div className="absolute inset-0 w-full h-full">
                      <motion.div 
                        className="h-full bg-orange-500 rounded-full relative" 
                        style={{ width: `${played * 100}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform" />
                      </motion.div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-white/30 w-8">{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-1 justify-end">
                <button
                  onClick={handleShowLyrics}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all flex items-center gap-2"
                  title="Show Lyrics"
                >
                  <Quote size={18} />
                  <span className="text-[10px] font-mono uppercase tracking-widest hidden md:inline">Lyrics</span>
                </button>
                <div className="flex items-center gap-3 group/volume">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    {isMuted || volume === 0 ? <VolumeX size={20} /> : volume < 0.5 ? <Volume1 size={20} /> : <Volume2 size={20} />}
                  </button>
                  <div className="w-24 h-1 bg-white/10 rounded-full relative group-hover/volume:bg-white/20 transition-colors">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        if (isMuted) setIsMuted(false);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-white rounded-full"
                      style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                    />
                  </div>
                </div>
                <button 
                  onClick={() => setCurrentSong(null)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/20 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="max-w-4xl mx-auto px-6 py-12 text-center text-white/20 text-xs font-mono uppercase tracking-widest border-t border-white/5">
        Moodify &copy; {new Date().getFullYear()} • Powered by Gemini AI
      </footer>
    </div>
    </ErrorBoundary>
  );
}
