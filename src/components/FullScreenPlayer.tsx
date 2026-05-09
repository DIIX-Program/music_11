import React, { useState, useEffect } from "react";
import { usePlayerStore } from "../store/playerStore";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import { PlaylistPickerModal } from "./PlaylistPickerModal";
import { 
  ChevronDown, X, Heart, Play, Pause, SkipBack, SkipForward, 
  Shuffle, Repeat, Mic2, ListMusic, MonitorSpeaker, Maximize2, 
  Volume2, ListPlus 
} from "lucide-react";
import clsx from "clsx";

interface FullScreenPlayerProps {
  progress: number;
  duration: number;
  volume: number;
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  togglePlay: () => void;
  formatTime: (time: number) => string;
}

export function FullScreenPlayer({
  progress,
  duration,
  volume,
  handleSeek,
  handleVolumeChange,
  togglePlay,
  formatTime
}: FullScreenPlayerProps) {
  const { 
    currentTrack, isPlaying, setShowLyrics, nextTrack, prevTrack, 
    queue, currentIndex: queueIndex, likedTrackIds, toggleLike 
  } = usePlayerStore();
  const { userId } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const isLiked = currentTrack ? likedTrackIds.has(currentTrack.id) : false;

  const fetchComments = async () => {
    if (!currentTrack) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/comments/${currentTrack.id}`);
      if (!res.ok) throw new Error("Không thể tải bình luận");
      const data = await res.json();
      if (data.success) {
        setComments(data.data || []);
      }
    } catch (err: any) {
      console.error("Fetch comments failed:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [currentTrack?.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userId || !currentTrack) return;

    try {
      const res = await fetch(`/api/comments/${currentTrack.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() })
      });
      
      const data = await res.json();
      if (data.success) {
        setComments([data.data, ...comments]);
        setNewComment("");
        addToast("Đã gửi bình luận! ✨", "success");
      } else {
        addToast(data.error || "Lỗi khi gửi bình luận", "error");
      }
    } catch (err) {
      addToast("Kết nối thất bại. Vui lòng thử lại.", "error");
    }
  };

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const volumePercent = volume * 100;
  const nextTracks = queue.slice(queueIndex + 1, queueIndex + 4);

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-[#0f3b1b] to-[#0a0a0a] text-white flex flex-col overflow-hidden animate-in fade-in duration-500">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between p-6 shrink-0">
        <button 
          onClick={() => setShowLyrics(false)}
          className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40 transition hover:scale-110 active:scale-90"
        >
          <ChevronDown size={24} />
        </button>
        <div className="text-center flex flex-col items-center">
          <span className="text-[10px] font-black tracking-[0.3em] text-[#1ed760] uppercase">MusicEVE Premium</span>
          <span className="text-sm font-bold mt-1 opacity-80 italic">Đang phát từ thư viện</span>
        </div>
        <button 
          onClick={() => setShowLyrics(false)}
          className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40 transition hover:scale-110 active:scale-90"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center px-10 gap-16 max-w-[1600px] mx-auto w-full min-h-0 py-4">
        
        {/* Left Column: Info & Lyrics */}
        <div className="flex-1 max-w-md flex flex-col justify-center animate-in slide-in-from-left duration-700">
          <h1 className="text-6xl font-black mb-4 leading-tight tracking-tighter drop-shadow-2xl">{currentTrack.title}</h1>
          <h2 className="text-2xl text-[#1ed760] font-black mb-12 tracking-tight opacity-90">{currentTrack.main_artist}</h2>
          
          <div className="space-y-6 text-2xl font-black text-zinc-500 mb-12 select-none overflow-hidden max-h-[300px]">
             <p className="hover:text-white transition cursor-pointer opacity-40">Mọi thứ dường như tan biến</p>
             <p className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">Chỉ còn giai điệu này ở lại</p>
             <p className="hover:text-white transition cursor-pointer opacity-40">Trong không gian vô tận...</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => toggleLike(currentTrack.id)}
              className={clsx(
                "flex items-center gap-2 px-8 py-3 rounded-full transition-all font-black text-sm tracking-widest hover:scale-105 active:scale-95 shadow-xl",
                isLiked ? "bg-[#1ed760] text-black" : "bg-white/10 hover:bg-white/20 text-white"
              )}
            >
              <Heart size={18} className={isLiked ? "fill-current" : ""} /> {isLiked ? "SAVED" : "SAVE"}
            </button>
            <button 
              onClick={() => setIsPickerOpen(true)}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-all font-black text-sm tracking-widest hover:scale-105 active:scale-95 shadow-xl text-white"
            >
              <ListPlus size={18} /> PLAYLIST
            </button>
          </div>
        </div>

        {/* Center Column: Artwork */}
        <div className="flex-shrink-0 w-[450px] h-[450px] lg:w-[550px] lg:h-[550px] rounded-[40px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/5 animate-in zoom-in duration-700">
          <img 
            src={currentTrack.cover_url || `https://picsum.photos/seed/${currentTrack.id}/800/800`} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Column: Up Next & Comments */}
        <div className="flex-1 max-w-sm flex flex-col gap-8 min-h-0 h-full animate-in slide-in-from-right duration-700">
          {/* Up Next Section */}
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black tracking-[0.4em] text-zinc-500 uppercase">TIẾP THEO</h3>
              <button className="text-[9px] font-black tracking-widest hover:text-[#1ed760] transition text-zinc-500 uppercase">XEM TẤT CẢ</button>
            </div>
            <div className="space-y-3">
              {nextTracks.length > 0 ? nextTracks.map((track, i) => (
                <div 
                  key={track.id} 
                  onClick={() => usePlayerStore.getState().setQueue(queue, queueIndex + 1 + i)}
                  className="flex items-center gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-white/5 transition-all hover:translate-x-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden shrink-0 relative shadow-lg">
                    <img src={track.cover_url || `https://picsum.photos/seed/${track.id}/100/100`} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Play size={16} className="fill-white text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="font-bold text-sm truncate group-hover:text-[#1ed760] transition">{track.title}</div>
                    <div className="text-[10px] text-zinc-500 font-black truncate uppercase tracking-widest">{track.main_artist}</div>
                  </div>
                </div>
              )) : (
                <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest text-center py-6 border-2 border-dashed border-white/5 rounded-[32px]">Hết danh sách chờ</div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="flex-1 flex flex-col min-h-0 bg-white/5 rounded-[32px] p-6 border border-white/5 shadow-2xl overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black tracking-[0.4em] text-zinc-300 uppercase">BÌNH LUẬN ({comments.length})</h3>
             </div>
             
             <form onSubmit={handlePostComment} className="mb-6 flex gap-2">
                <input 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Chia sẻ cảm xúc của bạn..." 
                  className="flex-1 bg-white/5 border border-white/10 focus:border-[#1ed760]/40 rounded-2xl px-5 py-3 text-sm outline-none transition-all placeholder:text-zinc-600 focus:bg-white/10"
                />
                <button className="w-12 h-12 flex items-center justify-center bg-[#1ed760] text-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-[#1ed760]/20">
                   <ListPlus size={20} />
                </button>
             </form>

             <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar-hide">
                {loadingComments ? (
                  <div className="space-y-4">
                     {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}
                  </div>
                ) : comments.length > 0 ? (
                  comments.map(c => (
                    <div key={c.id} className="flex gap-4 group">
                       <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden shrink-0 mt-1 shadow-md border border-white/10">
                         <img src={c.avatar_url || `https://picsum.photos/seed/${c.user_id}/40/40`} alt="" className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                           <span className="text-xs font-black text-white hover:text-[#1ed760] cursor-pointer transition">{c.username}</span>
                           <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter">{new Date(c.created_at).toLocaleDateString("vi-VN")}</span>
                         </div>
                         <p className="text-sm text-zinc-400 leading-relaxed font-medium">{c.content}</p>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-20 gap-3 grayscale">
                     <Mic2 size={32} />
                     <p className="text-[10px] font-black uppercase tracking-[0.2em]">Chưa có bình luận nào</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls Area */}
      <div className="px-12 pb-12 pt-6 bg-gradient-to-t from-black/80 to-transparent shrink-0">
        {/* Progress Bar */}
        <div className="flex items-center gap-6 mb-8 group">
          <span className="text-[10px] font-black text-zinc-500 tabular-nums w-12 text-right">{formatTime(progress)}</span>
          <div className="relative flex-1 h-2 bg-white/10 rounded-full cursor-pointer flex items-center overflow-hidden">
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={progress} 
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div 
              className="h-full bg-[#1ed760] rounded-full transition-all group-hover:bg-[#1ed760] shadow-[0_0_20px_rgba(30,215,96,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-black text-zinc-500 tabular-nums w-12">{formatTime(duration)}</span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between max-w-[1200px] mx-auto px-4">
          <div className="flex items-center gap-10 text-zinc-500">
            <button className="hover:text-white transition-all transform hover:scale-110"><Mic2 size={24} /></button>
            <button className="hover:text-white transition-all transform hover:scale-110"><ListMusic size={24} /></button>
          </div>

          <div className="flex items-center gap-10">
            <button className="text-zinc-500 hover:text-white transition-all transform hover:scale-110">
              <Shuffle size={24} />
            </button>
            <button onClick={prevTrack} className="text-zinc-200 hover:text-white transition-all transform hover:scale-125 active:scale-90">
              <SkipBack size={40} className="fill-current" />
            </button>
            <button 
              onClick={togglePlay} 
              className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)] group"
            >
              {isPlaying ? <Pause size={32} className="fill-black" /> : <Play size={32} className="fill-black ml-2" />}
            </button>
            <button onClick={nextTrack} className="text-zinc-200 hover:text-white transition-all transform hover:scale-125 active:scale-90">
              <SkipForward size={40} className="fill-current" />
            </button>
            <button className="text-zinc-500 hover:text-white transition-all transform hover:scale-110">
              <Repeat size={24} />
            </button>
          </div>

          <div className="flex items-center gap-8 text-zinc-500">
            <div className="flex items-center gap-3 w-40 group">
              <button className="hover:text-white transition-all"><Volume2 size={22} /></button>
              <div className="relative flex-1 h-1.5 bg-white/10 rounded-full flex items-center overflow-hidden">
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01"
                  value={volume} 
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="h-full bg-white group-hover:bg-[#1ed760] rounded-full transition-all" style={{ width: `${volumePercent}%` }} />
              </div>
            </div>
            <button className="hover:text-white transition-all transform hover:scale-110"><MonitorSpeaker size={24} /></button>
            <button onClick={() => setShowLyrics(false)} className="hover:text-white transition-all transform hover:scale-110"><Maximize2 size={24} /></button>
          </div>
        </div>
      </div>

      {userId && currentTrack && (
        <PlaylistPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          trackId={currentTrack.id}
          userId={userId}
        />
      )}
    </div>
  );
}
