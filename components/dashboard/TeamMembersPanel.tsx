"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ChevronDown, Crown, Shield, User } from "lucide-react";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import type { MemberProfile } from "@/lib/firebase/firestore";
import type { TeamRole } from "@/types";
import { cn } from "@/lib/utils/cn";

interface TeamMembersPanelProps {
  members: MemberProfile[];
  loading: boolean;
  teamName: string;
}

function RoleBadge({ role }: { role: TeamRole }) {
  if (role === "owner") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
        <Crown className="w-3 h-3" />
        Owner
      </span>
    );
  }
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/15 text-violet-400 border border-violet-500/20">
        <Shield className="w-3 h-3" />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/8 text-dark-300 border border-white/8">
      <User className="w-3 h-3" />
      Member
    </span>
  );
}

function MemberAvatar({ name, photoURL }: { name: string; photoURL?: string }) {
  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoURL}
        alt={name}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-400 to-violet-600 flex items-center justify-center text-xs font-bold text-dark-950 flex-shrink-0">
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export function TeamMembersPanel({
  members,
  loading,
  teamName,
}: TeamMembersPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/8 bg-dark-900/60 backdrop-blur-sm overflow-hidden">
      {/* Header — click to toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Users className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">
              {teamName} Members
            </p>
            <p className="text-xs text-dark-400">
              {loading
                ? "Loading…"
                : `${members.length} member${members.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-dark-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Members list */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/6 divide-y divide-white/4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-white/8 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-32 rounded bg-white/8 animate-pulse" />
                      <div className="h-2.5 w-44 rounded bg-white/6 animate-pulse" />
                    </div>
                  </div>
                ))
              ) : members.length === 0 ? (
                <p className="px-5 py-4 text-sm text-dark-400">
                  No members found.
                </p>
              ) : (
                members.map((m) => {
                  const joinedDate =
                    m.joinedAt instanceof Timestamp
                      ? m.joinedAt.toDate()
                      : m.joinedAt instanceof Date
                        ? m.joinedAt
                        : null;
                  return (
                    <div
                      key={m.userId}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-white/3 transition-colors"
                    >
                      <MemberAvatar name={m.name} photoURL={m.photoURL} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {m.name}
                        </p>
                        <p className="text-xs text-dark-400 truncate">
                          {m.email}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <RoleBadge role={m.role} />
                        {joinedDate && (
                          <span className="text-xs text-dark-500">
                            {format(joinedDate, "dd MMM yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
