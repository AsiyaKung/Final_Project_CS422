"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Zap,
  ChevronRight,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";
import { useTeams } from "@/lib/hooks/useTeams";
import { cn } from "@/lib/utils/cn";
import type { Team } from "@/types";

interface SidebarProps {
  activeTeamId: string | null;
  onTeamSelect: (teamId: string) => void;
  onCreateTeam: () => void;
  onJoinTeam: () => void;
  open: boolean;
  onClose: () => void;
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  activeTeamId,
  onTeamSelect,
  onCreateTeam,
  onJoinTeam,
  open,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { teams, loading } = useTeams();
  const [teamsOpen, setTeamsOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full w-64 bg-dark-900/95 backdrop-blur-xl border-r border-white/6",
        // Mobile: slide-in drawer; desktop: always visible static sidebar
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300",
        "md:relative md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
    >
      {/* Logo + mobile close button */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-neon-400/10 border border-neon-400/20">
            <Zap className="w-5 h-5 text-neon-400" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">
            TaskFlow
          </span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/8 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 py-4">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-neon-400/10 text-neon-400 border border-neon-400/20"
                  : "text-dark-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Teams list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <button
          onClick={() => setTeamsOpen((v) => !v)}
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-dark-400 hover:text-dark-200 transition-colors"
        >
          <span>My Teams</span>
          <ChevronRight
            className={cn(
              "w-3 h-3 transition-transform duration-200",
              teamsOpen && "rotate-90",
            )}
          />
        </button>

        <AnimatePresence>
          {teamsOpen && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mt-1 flex flex-col gap-1"
            >
              {loading ? (
                // Skeleton
                Array.from({ length: 2 }).map((_, i) => (
                  <li
                    key={i}
                    className="h-8 rounded-lg bg-white/5 animate-pulse"
                  />
                ))
              ) : teams.length === 0 ? (
                <li className="text-xs text-dark-500 px-3 py-2">
                  No teams yet
                </li>
              ) : (
                teams.map((team: Team) => (
                  <li key={team.teamId}>
                    <button
                      onClick={() => onTeamSelect(team.teamId)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left",
                        activeTeamId === team.teamId
                          ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                          : "text-dark-300 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <span className="w-2 h-2 rounded-full bg-current flex-shrink-0 opacity-60" />
                      <span className="truncate">{team.name}</span>
                    </button>
                  </li>
                ))
              )}

              {/* Create / Join buttons */}
              <li className="mt-2 flex flex-col gap-1">
                <button
                  onClick={onCreateTeam}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neon-400 hover:bg-neon-400/8 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> New Team
                </button>
                <button
                  onClick={onJoinTeam}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-violet-400 hover:bg-violet-400/8 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Join Team
                </button>
              </li>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* User footer */}
      <div className="border-t border-white/6 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt={user.displayName ?? "avatar"}
                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-400 to-violet-600 flex items-center justify-center text-xs font-bold text-dark-950 flex-shrink-0">
                {user?.displayName?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user?.displayName}
              </p>
              <p className="text-xs text-dark-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
