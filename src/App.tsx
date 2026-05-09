/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Player } from "./components/Player";
import { TopBar } from "./components/TopBar";
import { Home } from "./pages/Home";
import { Upload } from "./pages/Upload";
import { Search } from "./pages/Search";
import { Auth } from "./pages/Auth";
import { Artist } from "./pages/Artist";
import { Premium } from "./pages/Premium";
import { Profile } from "./pages/Profile";
import { Library } from "./pages/Library";
import { Playlists } from "./pages/Playlists";
import { PlaylistDetail } from "./pages/PlaylistDetail";
import AdminPage from "./pages/AdminPage";
import { ToastContainer } from "./components/Toast";
import { useAuthStore } from "./store/authStore";
import { usePlayerStore } from "./store/playerStore";
import { useLayoutStore } from "./store/layoutStore";

import { useLibrarySync } from "./hooks/useLibrarySync";

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === "/auth";
  const { setAuth, userId, isAdmin } = useAuthStore();
  const { setPlaying } = usePlayerStore();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // SSOT: Synchronize library data (likedSongs, playlists, history)
  useLibrarySync();

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAuth(data.userId, data.isAdmin, data.isArtist);
        } else {
          setAuth(null, false, false);
        }
      })
      .catch(() => setAuth(null, false, false))
      .finally(() => setIsInitialLoading(false));
  }, [setAuth]);

  if (isInitialLoading) {
    return (
      <div className="h-screen w-full bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 bg-[#1ed760] rounded-full animate-pulse shadow-[0_0_30px_rgba(30,215,96,0.5)]" />
           <span className="text-[#1ed760] font-black uppercase tracking-[0.4em] text-[10px]">The Curator</span>
        </div>
      </div>
    );
  }

  if (isAuthPage) {
    return (
      <>
        <ToastContainer />
        <Auth />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-[#121212] overflow-hidden text-white font-sans selection:bg-[#1ed760]/30 selection:text-black">
      <ToastContainer />
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative flex flex-col scrollbar-hide">
        <TopBar />
        <div className="flex-1 px-8 pb-32 pt-6 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full h-full"
            >
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/library" element={<Library />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/playlist/:id" element={<PlaylistDetail />} />
                <Route path="/premium" element={<Premium />} />
                <Route path="/artist/:id" element={<Artist />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/upload" element={userId ? <Upload /> : <Navigate to="/auth" />} />
                <Route path="/admin" element={isAdmin ? <AdminPage /> : <Navigate to="/" />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Player />
    </div>
  );
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppLayout />
      </Router>
    </QueryClientProvider>
  );
}
