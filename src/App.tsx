import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Music,
  Trash2,
  ChevronDown,
  ListMusic,
  Settings,
  Volume2,
  VolumeX,
  Upload,
  Heart,
  MoreVertical,
  Search,
  Clock,
  Disc,
  ArrowLeft
} from 'lucide-react';
import { useMusicPlayer } from './hooks/useMusicPlayer';
import type { Song } from './hooks/useMusicPlayer';

type Screen = 'library' | 'player' | 'queue' | 'settings';

// ============ UTILITY COMPONENTS ============

function AlbumArt({ song, size = 'small' }: { song?: Song | null; size?: 'small' | 'large' }) {
  if (size === 'large') {
    return (
      <div className="album-art-large pulse-glow">
        {song ? (
          <Music size={80} className="text-purple-400 opacity-50" />
        ) : (
          <Music size={80} className="text-gray-600" />
        )}
      </div>
    );
  }
  return (
    <div className="album-art">
      <Music size={24} className="text-purple-400 opacity-60" />
    </div>
  );
}

// ============ SCREENS ============

function LibraryScreen({
  player,
  onNavigate
}: {
  player: ReturnType<typeof useMusicPlayer>;
  onNavigate: (s: Screen) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const filteredSongs = player.songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    player.addSongs(e.target.files);
    e.target.value = '';
  };

  return (
    <div className="screen-container">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold gradient-text">مكتبتي</h1>
            <p className="text-xs text-white/40 mt-1">"{player.songs.length} أغنية"</p>
          </div>
          <button onClick={player.openFilePicker} className="btn-primary flex items-center gap-2 text-sm">
            <Upload size={18} />
            إضافة
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
          />
        </div>
      </div>

      {/* Songs List */}
      <div className="scroll-content px-4">
        {player.songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Music size={40} className="text-white/20" />
            </div>
            <p className="text-white/50 text-sm mb-2">لا توجد أغاني</p>
            <p className="text-white/30 text-xs">اضغط "إضافة" لاستيراد ملفات MP3</p>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/40 text-sm">لا توجد نتائج</p>
          </div>
        ) : (
          filteredSongs.map((song) => (
            <div
              key={song.id}
              className={`song-item relative ${player.currentSong?.id === song.id ? 'active' : ''}`}
              onClick={() => player.playSong(song)}
            >
              <AlbumArt song={song} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{song.title}</p>
                <p className="text-xs text-white/50 truncate">{song.artist}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/30">{player.formatTime(song.duration)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(showMenu === song.id ? null : song.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10"
                >
                  <MoreVertical size={16} className="text-white/50" />
                </button>
              </div>

              {/* Dropdown Menu */}
              {showMenu === song.id && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(null)} />
                  <div className="absolute left-4 top-12 z-50 glass-card rounded-xl py-2 min-w-[140px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        player.removeSong(song.id);
                        setShowMenu(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5"
                    >
                      <Trash2 size={16} />
                      حذف
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
        <div className="h-4" />
      </div>

      {/* Hidden File Input */}
      <input
        ref={player.fileInputRef}
        type="file"
        accept="audio/*,.mp3"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Mini Player */}
      {player.currentSong && (
        <MiniPlayer player={player} onExpand={() => onNavigate('player')} />
      )}
    </div>
  );
}

function MiniPlayer({ player, onExpand }: {
  player: ReturnType<typeof useMusicPlayer>;
  onExpand: () => void;
}) {
  return (
    <div
      className="mx-4 mb-2 glass-card rounded-2xl p-3 cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onExpand}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center flex-shrink-0">
          <Music size={20} className="text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{player.currentSong?.title}</p>
          <p className="text-xs text-white/50 truncate">{player.currentSong?.artist}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              player.handlePrevious();
            }}
            className="p-2 rounded-full hover:bg-white/10"
          >
            <SkipBack size={18} className="text-white/70" fill="white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              player.togglePlay();
            }}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 flex items-center justify-center"
          >
            {player.isPlaying ? (
              <Pause size={18} className="text-white" fill="white" />
            ) : (
              <Play size={18} className="text-white ml-0.5" fill="white" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              player.handleNext();
            }}
            className="p-2 rounded-full hover:bg-white/10"
          >
            <SkipForward size={18} className="text-white/70" fill="white" />
          </button>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-2">
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-300"
            style={{
              width: player.duration > 0 ? `${(player.currentTime / player.duration) * 100}%` : '0%'
            }}
          />
        </div>
      </div>
    </div>
  );
}

function PlayerScreen({
  player,
  onBack
}: {
  player: ReturnType<typeof useMusicPlayer>;
  onBack: () => void;
}) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="screen-container bg-gradient-to-b from-[#1a1a2e] via-[#0f0f1a] to-[#0a0a14]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <button onClick={onBack} className="p-2 -mr-2">
          <ChevronDown size={28} className="text-white/70" />
        </button>
        <p className="text-xs text-white/40 uppercase tracking-widest">"Now Playing"</p>
        <button className="p-2 -ml-2">
          <MoreVertical size={22} className="text-white/70" />
        </button>
      </div>

      {/* Album Art */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="mb-8">
          <AlbumArt song={player.currentSong} size="large" />
        </div>

        {/* Song Info */}
        <div className="w-full text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-1 truncate">{player.currentSong?.title || 'Unknown'}</h2>
          <p className="text-sm text-white/50 truncate">{player.currentSong?.artist || 'Unknown Artist'}</p>
        </div>

        {/* Controls */}
        <div className="w-full mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/40 w-12 text-left">{player.formatTime(player.currentTime)}</span>
            <input
              type="range"
              min={0}
              max={player.duration || 100}
              value={player.currentTime}
              onChange={(e) => player.seek(Number(e.target.value))}
              className="progress-bar flex-1 mx-3"
            />
            <span className="text-xs text-white/40 w-12 text-right">{player.formatTime(player.duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={player.toggleShuffle} className={player.shuffle ? 'text-purple-400' : 'text-white/40'}>
            <Shuffle size={20} />
          </button>
          <button onClick={player.handlePrevious} className="p-2">
            <SkipBack size={28} className="text-white" fill="white" />
          </button>
          <button
            onClick={player.togglePlay}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-900/50"
          >
            {player.isPlaying ? (
              <Pause size={28} className="text-white" fill="white" />
            ) : (
              <Play size={28} className="text-white ml-1" fill="white" />
            )}
          </button>
          <button onClick={player.handleNext} className="p-2">
            <SkipForward size={28} className="text-white" fill="white" />
          </button>
          <button onClick={player.toggleRepeat} className={player.repeat !== 'none' ? 'text-purple-400' : 'text-white/40'}>
            {player.repeat === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
          </button>
        </div>

        {/* Extra Controls */}
        <div className="flex items-center justify-between w-full px-4">
          <button onClick={() => setIsLiked(!isLiked)}>
            <Heart size={22} className={isLiked ? 'text-red-500' : 'text-white/40'} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <div className="flex items-center gap-2 flex-1 mx-4">
            <button onClick={() => player.setVolume(player.volume > 0 ? 0 : 0.8)}>
              {player.volume === 0 ? <VolumeX size={18} className="text-white/40" /> : <Volume2 size={18} className="text-white/40" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={player.volume}
              onChange={(e) => player.setVolume(Number(e.target.value))}
              className="progress-bar"
              style={{ height: 3 }}
            />
          </div>
        </div>
      </div>

      {/* Visualizer */}
      {player.isPlaying && (
        <div className="flex items-end justify-center gap-1 py-4 h-16">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="visualizer-bar"
              style={{
                animationDelay: `${i * 0.05}s`,
                animationDuration: `${0.4 + Math.random() * 0.5}s`,
                opacity: 0.6 + (i / 40)
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QueueScreen({
  player,
  onBack,
  onPlaySong
}: {
  player: ReturnType<typeof useMusicPlayer>;
  onBack: () => void;
  onPlaySong: (song: Song) => void;
}) {
  return (
    <div className="screen-container">
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <button onClick={onBack} className="p-2 -mr-2">
          <ArrowLeft size={24} className="text-white/70" />
        </button>
        <h1 className="text-xl font-bold gradient-text">قائمة التشغيل</h1>
      </div>

      <div className="scroll-content px-4">
        {player.songs.length === 0 ? (
          <div className="text-center py-20">
            <ListMusic size={48} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">القائمة فارغة</p>
          </div>
        ) : (
          player.songs.map((song, index) => (
            <div
              key={song.id}
              className={`song-item ${player.currentSong?.id === song.id ? 'active' : ''}`}
              onClick={() => onPlaySong(song)}
            >
              <span className="text-sm text-white/30 w-6 text-center">{index + 1}</span>
              <AlbumArt song={song} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{song.title}</p>
                <p className="text-xs text-white/50 truncate">{song.artist}</p>
              </div>
              <span className="text-xs text-white/30">{player.formatTime(song.duration)}</span>
            </div>
          ))
        )}
        <div className="h-4" />
      </div>
    </div>
  );
}

function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [pwaInstalled, setPwaInstalled] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaInstalled(true);
    }
  }, []);

  const clearData = () => {
    if (confirm('هل أنت متأكد من حذف جميع الأغاني؟')) {
      localStorage.removeItem('music-player-songs');
      localStorage.removeItem('music-player-state');
      window.location.reload();
    }
  };

  return (
    <div className="screen-container">
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <button onClick={onBack} className="p-2 -mr-2">
          <ArrowLeft size={24} className="text-white/70" />
        </button>
        <h1 className="text-xl font-bold gradient-text">الإعدادات</h1>
      </div>

      <div className="scroll-content px-5">
        {/* App Info */}
        <div className="glass-card rounded-2xl p-5 mb-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center mx-auto mb-3">
            <Music size={36} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Music Player</h2>
          <p className="text-sm text-white/50 mb-2">"مشغل موسيقى احترافي"</p>
          <span className="inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs">
            v1.0.0
          </span>
          {pwaInstalled && (
            <p className="text-xs text-green-400 mt-2">"تم التثبيت كتطبيق"</p>
          )}
        </div>

        {/* Stats */}
        <div className="glass-card rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-medium text-white/70 mb-3">"إحصائيات"</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Music size={20} className="text-purple-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{JSON.parse(localStorage.getItem('music-player-songs') || '[]').length}</p>
              <p className="text-xs text-white/40">"أغنية"</p>
            </div>
            <div className="text-center">
              <Disc size={20} className="text-purple-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">MP3</p>
              <p className="text-xs text-white/40">"الصيغة"</p>
            </div>
            <div className="text-center">
              <Clock size={20} className="text-purple-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">Local</p>
              <p className="text-xs text-white/40">"التشغيل"</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="glass-card rounded-2xl overflow-hidden mb-4">
          <button
            onClick={clearData}
            className="w-full flex items-center gap-3 px-5 py-4 text-red-400 hover:bg-white/5 transition-colors text-right"
          >
            <Trash2 size={20} />
            <span className="text-sm font-medium">"مسح جميع الأغاني"</span>
          </button>
        </div>

        {/* About */}
        <div className="text-center py-6">
          <p className="text-xs text-white/30">"صنع بإتقان"</p>
          <p className="text-xs text-white/20 mt-1">"PWA Music Player"</p>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN APP ============

function App() {
  const player = useMusicPlayer();
  const [currentScreen, setCurrentScreen] = useState<Screen>('library');
  const [activeTab, setActiveTab] = useState<Screen>('library');

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
    if (screen !== 'player') {
      setActiveTab(screen);
    }
  };

  const handleTabPress = (tab: Screen) => {
    setActiveTab(tab);
    setCurrentScreen(tab);
  };

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silently fail
      });
    }
  }, []);

  // Handle screen transitions
  const renderScreen = () => {
    switch (currentScreen) {
      case 'library':
        return <LibraryScreen player={player} onNavigate={handleNavigate} />;
      case 'player':
        return <PlayerScreen player={player} onBack={() => handleNavigate(activeTab)} />;
      case 'queue':
        return <QueueScreen player={player} onBack={() => handleNavigate('library')} onPlaySong={player.playSong} />;
      case 'settings':
        return <SettingsScreen onBack={() => handleNavigate('library')} />;
      default:
        return <LibraryScreen player={player} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="h-full w-full bg-[#0f0f1a] flex flex-col overflow-hidden">
      {/* Status Bar */}
      <div className="android-status-bar" />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderScreen()}
      </div>

      {/* Bottom Navigation */}
      {currentScreen !== 'player' && (
        <nav className="bottom-nav">
          <button
            onClick={() => handleTabPress('library')}
            className={`nav-item ${activeTab === 'library' ? 'active' : ''}`}
          >
            <Music size={22} />
            <span>"المكتبة"</span>
          </button>
          <button
            onClick={() => handleTabPress('queue')}
            className={`nav-item ${activeTab === 'queue' ? 'active' : ''}`}
          >
            <ListMusic size={22} />
            <span>"القائمة"</span>
          </button>
          <button
            onClick={() => handleTabPress('settings')}
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Settings size={22} />
            <span>"الإعدادات"</span>
          </button>
        </nav>
      )}

      {/* Safe Area */}
      <div className="android-nav-bar" />
    </div>
  );
}

export default App;
