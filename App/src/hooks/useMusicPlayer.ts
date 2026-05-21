import { useState, useRef, useCallback, useEffect } from 'react';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  url: string;
  cover?: string;
}

export interface MusicPlayerState {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeat: 'none' | 'all' | 'one';
  shuffle: boolean;
  queue: Song[];
}

const STORAGE_KEY = 'music-player-songs';
const STATE_KEY = 'music-player-state';

export function useMusicPlayer() {
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [currentSong, setCurrentSong] = useState<Song | null>(() => {
    try {
      const stored = localStorage.getItem(STATE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        return state.currentSong || null;
      }
    } catch { /* empty */ }
    return null;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [repeat, setRepeat] = useState<'none' | 'all' | 'one'>('none');
  const [shuffle, setShuffle] = useState(false);
  const [queue] = useState<Song[]>([]);
  const [isReady, setIsReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => handleNext();
    const handleCanPlay = () => setIsReady(true);
    const handleError = () => {
      setIsPlaying(false);
      setIsReady(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Save songs to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
  }, [songs]);

  // Save state
  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify({ currentSong }));
  }, [currentSong]);

  // Handle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [isPlaying, currentSong]);

  // Play specific song
  const playSong = useCallback((song: Song) => {
    if (!audioRef.current) return;

    setIsReady(false);
    setCurrentSong(song);
    audioRef.current.src = song.url;
    audioRef.current.load();

    audioRef.current.play().then(() => {
      setIsPlaying(true);
      setCurrentTime(0);
    }).catch(() => {
      setIsPlaying(false);
    });
  }, []);

  // Seek
  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  // Next song
  const handleNext = useCallback(() => {
    if (!currentSong || songs.length === 0) return;

    if (repeat === 'one') {
      playSong(currentSong);
      return;
    }

    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    let nextIndex: number;

    if (shuffle) {
      nextIndex = Math.floor(Math.random() * songs.length);
    } else {
      nextIndex = (currentIndex + 1) % songs.length;
    }

    if (nextIndex >= 0 && nextIndex < songs.length) {
      playSong(songs[nextIndex]);
    }
  }, [currentSong, songs, repeat, shuffle, playSong]);

  // Previous song
  const handlePrevious = useCallback(() => {
    if (!currentSong || songs.length === 0) return;

    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    const prevIndex = currentIndex <= 0 ? songs.length - 1 : currentIndex - 1;

    if (prevIndex >= 0 && prevIndex < songs.length) {
      playSong(songs[prevIndex]);
    }
  }, [currentSong, songs, playSong]);

  // Add songs from files
  const addSongs = useCallback((files: FileList | null) => {
    if (!files) return;

    const newSongs: Song[] = [];
    const audioFiles = Array.from(files).filter(f =>
      f.type.startsWith('audio/') || f.name.endsWith('.mp3')
    );

    audioFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      // Extract metadata from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const parts = nameWithoutExt.split(/[-–]/).map(p => p.trim());

      let title = nameWithoutExt;
      let artist = 'Unknown Artist';
      let album = 'Unknown Album';

      if (parts.length >= 2) {
        artist = parts[0];
        title = parts.slice(1).join(' - ');
      }

      const song: Song = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        artist,
        album,
        duration: 0,
        url,
      };

      newSongs.push(song);

      // Try to get actual duration
      const tempAudio = new Audio(url);
      tempAudio.addEventListener('loadedmetadata', () => {
        setSongs(prev =>
          prev.map(s =>
            s.id === song.id ? { ...s, duration: tempAudio.duration } : s
          )
        );
      });
    });

    setSongs(prev => [...prev, ...newSongs]);
  }, []);

  // Remove song
  const removeSong = useCallback((id: string) => {
    setSongs(prev => {
      const song = prev.find(s => s.id === id);
      if (song) {
        URL.revokeObjectURL(song.url);
      }
      return prev.filter(s => s.id !== id);
    });
    if (currentSong?.id === id) {
      setCurrentSong(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    }
  }, [currentSong]);

  // Format time
  const formatTime = useCallback((time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Toggle repeat
  const toggleRepeat = useCallback(() => {
    setRepeat(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  }, []);

  // Toggle shuffle
  const toggleShuffle = useCallback(() => {
    setShuffle(prev => !prev);
  }, []);

  // Open file picker
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    // State
    songs,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeat,
    shuffle,
    queue,
    isReady,
    fileInputRef,

    // Actions
    togglePlay,
    playSong,
    seek,
    handleNext,
    handlePrevious,
    addSongs,
    removeSong,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    openFilePicker,
    formatTime,
  };
}
