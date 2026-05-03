"use client";
// Dashboard layout – wraps all /dashboard/* and /teams/* routes.
// Guards against unauthenticated access; shows the sidebar.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { CreateTeamModal } from "@/components/dashboard/CreateTeamModal";
import { JoinTeamModal } from "@/components/dashboard/JoinTeamModal";
import { Menu, Zap } from "lucide-react";

// Store active team selection in module-level state so it persists
// across layout re-renders without a context provider.
let _activeTeamId: string | null = null;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTeamId, setActiveTeamId] = useState<string | null>(
    _activeTeamId,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const handleTeamSelect = (id: string) => {
    _activeTeamId = id;
    setActiveTeamId(id);
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neon-400">
          <Zap className="w-6 h-6 animate-pulse" />
          <span className="text-sm font-medium">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return null; // will redirect

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        activeTeamId={activeTeamId}
        onTeamSelect={handleTeamSelect}
        onCreateTeam={() => {
          setCreateOpen(true);
          setSidebarOpen(false);
        }}
        onJoinTeam={() => {
          setJoinOpen(true);
          setSidebarOpen(false);
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-dark-900/90 backdrop-blur-xl border-b border-white/6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-dark-300 hover:text-white hover:bg-white/8 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-neon-400/10 border border-neon-400/20">
              <Zap className="w-4 h-4 text-neon-400" />
            </div>
            <span className="text-sm font-bold text-white">TaskFlow</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
          {children}
        </div>
      </main>

      {/* Global modals */}
      <CreateTeamModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinTeamModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  );
}
