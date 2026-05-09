import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, Loader2, User } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";

interface Comment {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content: string;
  created_at: string;
}

interface CommentSectionProps {
  trackId: string;
}

export function CommentSection({ trackId }: CommentSectionProps) {
  const { userId } = useAuthStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["comments", trackId],
    queryFn: async () => {
      const res = await fetch(`/api/comments/${trackId}`);
      if (!res.ok) throw new Error("Không thể tải bình luận");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Lỗi không xác định");
      return json.data;
    },
    enabled: !!trackId,
  });

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/comments/${trackId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Lỗi khi gửi bình luận");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: (newComment) => {
      // Optimistic update would be better but simple invalidate is stable
      queryClient.setQueryData(["comments", trackId], (old: Comment[] | undefined) => {
        return [newComment, ...(old || [])];
      });
      setContent("");
      addToast("Bình luận đã được đăng!", "success");
    },
    onError: (err: any) => {
      addToast(err.message || "Không thể đăng bình luận", "error");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      addToast("Bạn cần đăng nhập để bình luận!", "info");
      return;
    }
    if (!content.trim()) return;
    mutation.mutate(content.trim());
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="text-[#1ed760]" size={24} />
          <h3 className="text-xl font-black tracking-tight">Bình luận</h3>
          <span className="bg-white/5 px-2 py-0.5 rounded-full text-[10px] text-zinc-500 font-bold">
            {comments.length}
          </span>
        </div>
      </div>

      {/* Input Section */}
      <form onSubmit={handleSubmit} className="relative group">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={userId ? "Viết suy nghĩ của bạn về bài hát này..." : "Đăng nhập để tham gia thảo luận"}
          disabled={!userId || mutation.isPending}
          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#1ed760]/30 transition-all resize-none min-h-[100px] shadow-xl"
        />
        <div className="absolute bottom-4 right-4 flex items-center gap-3">
          <span className={clsx(
            "text-[10px] font-bold transition-opacity",
            content.length > 0 ? "opacity-30" : "opacity-0"
          )}>
            {content.length}/500
          </span>
          <button
            type="submit"
            disabled={!userId || !content.trim() || mutation.isPending}
            className="w-10 h-10 bg-[#1ed760] text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
          >
            {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="fill-current" />}
          </button>
        </div>
      </form>

      {/* List Section */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-zinc-700" size={32} />
          </div>
        ) : comments.length > 0 ? (
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/5 overflow-hidden flex items-center justify-center">
                    {comment.avatar_url ? (
                      <img src={comment.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <User size={14} className="text-zinc-600" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white group-hover:text-[#1ed760] transition-colors">
                      {comment.username}
                      {comment.user_id === userId && (
                        <span className="ml-2 text-[8px] bg-[#1ed760] text-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">Bạn</span>
                      )}
                    </span>
                    <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
                      {new Date(comment.created_at).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 font-medium leading-relaxed pl-11">
                  {comment.content}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-4 border border-dashed border-white/5 rounded-3xl opacity-30">
            <MessageCircle size={40} className="text-zinc-700" />
            <div className="space-y-1">
              <p className="text-sm font-bold uppercase tracking-widest">Chưa có bình luận</p>
              <p className="text-[10px]">Hãy là người đầu tiên chia sẻ cảm nhận!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
