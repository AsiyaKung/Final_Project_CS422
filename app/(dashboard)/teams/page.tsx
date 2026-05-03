"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Copy,
  Trash2,
  Plus,
  Crown,
  Shield,
  User,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

import { useTeams } from "@/lib/hooks/useTeams";
import { useTeamMembers } from "@/lib/hooks/useTeamMembers";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CreateTeamModal } from "@/components/dashboard/CreateTeamModal";
import { JoinTeamModal } from "@/components/dashboard/JoinTeamModal";
import type { Team, TeamRole } from "@/types";
import type { MemberProfile } from "@/lib/firebase/firestore";

// ── Member row with role dropdown (owner only) ─────────────────

function MemberRow({
  member,
  isOwner,
  currentUserId,
  teamId,
  updateRole,
}: {
  member: MemberProfile;
  isOwner: boolean;
  currentUserId: string;
  teamId: string;
  updateRole: (userId: string, role: "admin" | "member") => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  const handleChange = async (newRole: "admin" | "member") => {
    setSaving(true);
    try {
      await updateRole(member.userId, newRole);
      toast.success(`${member.name} is now ${newRole}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const roleIcon =
    member.role === "owner" ? (
      <Crown className="w-3 h-3 text-amber-400" />
    ) : member.role === "admin" ? (
      <Shield className="w-3 h-3 text-violet-400" />
    ) : (
      <User className="w-3 h-3 text-dark-400" />
    );

  const roleBadgeColor =
    member.role === "owner"
      ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
      : member.role === "admin"
        ? "bg-violet-500/15 text-violet-400 border-violet-500/20"
        : "bg-white/8 text-dark-300 border-white/10";

  return (
    <div className="flex items-center justify-between py-2 px-1">
      <div className="flex items-center gap-2.5 min-w-0">
        {member.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.photoURL}
            alt={member.name}
            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-400 to-violet-600 flex items-center justify-center text-xs font-bold text-dark-950 flex-shrink-0">
            {member.name[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {member.name}
            {member.userId === currentUserId && (
              <span className="ml-1.5 text-xs text-dark-500">(you)</span>
            )}
          </p>
          <p className="text-xs text-dark-500 truncate">{member.email}</p>
        </div>
      </div>

      {/* Role — dropdown for owner, badge otherwise */}
      {isOwner && member.role !== "owner" && member.userId !== currentUserId ? (
        <div className="relative flex-shrink-0">
          <select
            value={member.role}
            disabled={saving}
            onChange={(e) => handleChange(e.target.value as "admin" | "member")}
            className="appearance-none pl-3 pr-7 py-1 rounded-full text-xs font-medium bg-dark-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-neon-400/30 cursor-pointer disabled:opacity-50"
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-dark-400" />
        </div>
      ) : (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadgeColor}`}
        >
          {roleIcon}
          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
        </span>
      )}
    </div>
  );
}

// ── Team card with members ─────────────────────────────────────

function TeamCard({
  team,
  currentUserId,
  onDelete,
}: {
  team: Team;
  currentUserId: string;
  onDelete: (teamId: string, name: string) => void;
}) {
  const isOwner = team.ownerId === currentUserId;
  const {
    members,
    loading: membersLoading,
    updateMemberRole,
  } = useTeamMembers(team.teamId);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(team.inviteCode);
    toast.success("Invite code copied!");
  };

  // Sort: owner first, then admin, then member
  const roleOrder: Record<TeamRole, number> = { owner: 0, admin: 1, member: 2 };
  const sortedMembers = [...members].sort(
    (a, b) => roleOrder[a.role] - roleOrder[b.role],
  );

  return (
    <Card hover neon={isOwner ? "violet" : false}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">{team.name}</h3>
          <Badge variant={isOwner ? "violet" : "gray"}>
            {isOwner
              ? "Owner"
              : members.find((m) => m.userId === currentUserId)?.role ===
                  "admin"
                ? "Admin"
                : "Member"}
          </Badge>
        </div>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        {/* Invite code */}
        <div className="flex items-center justify-between bg-white/4 rounded-xl px-3 py-2">
          <div>
            <p className="text-xs text-dark-500 mb-0.5">Invite Code</p>
            <code className="text-sm font-mono text-neon-400">
              {team.inviteCode}
            </code>
          </div>
          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg text-dark-400 hover:text-neon-400 hover:bg-neon-400/10 transition-colors"
            title="Copy invite code"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Members list */}
        <div>
          <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
            Members ({membersLoading ? "…" : members.length})
          </p>
          <div className="divide-y divide-white/4 rounded-xl border border-white/6 overflow-hidden">
            {membersLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2">
                    <div className="w-7 h-7 rounded-full bg-white/8 animate-pulse flex-shrink-0" />
                    <div className="flex-1 h-3 rounded bg-white/6 animate-pulse" />
                  </div>
                ))
              : sortedMembers.map((m) => (
                  <div key={m.userId} className="px-3">
                    <MemberRow
                      member={m}
                      isOwner={isOwner}
                      currentUserId={currentUserId}
                      teamId={team.teamId}
                      updateRole={updateMemberRole}
                    />
                  </div>
                ))}
          </div>
        </div>

        {/* Danger zone */}
        {isOwner && (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="danger"
              onClick={() => onDelete(team.teamId, team.name)}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Team
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function TeamsPage() {
  const { user } = useAuth();
  const { teams, loading, deleteTeam } = useTeams();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const handleDelete = async (teamId: string, name: string) => {
    if (!confirm(`Delete team "${name}"? This cannot be undone.`)) return;
    try {
      await deleteTeam(teamId);
      toast.success("Team deleted.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete team");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-violet-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
              Teams
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Team Management
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            Manage teams, members, and roles.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="ghost" onClick={() => setJoinOpen(true)} size="md">
            Join Team
          </Button>
          <Button
            variant="secondary"
            onClick={() => setCreateOpen(true)}
            size="md"
          >
            <Plus className="w-4 h-4" /> New Team
          </Button>
        </div>
      </motion.div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Crown className="w-3 h-3" /> Owner — full control
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
          <Shield className="w-3 h-3" /> Admin — create &amp; manage tasks
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-dark-300">
          <User className="w-3 h-3" /> Member — view &amp; move tasks only
        </span>
      </div>

      {/* Teams grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-white/3 animate-pulse"
            />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <Card className="py-20 flex flex-col items-center justify-center text-center gap-3">
          <Users className="w-10 h-10 text-dark-600" />
          <p className="text-dark-400 text-sm">You are not in any team yet.</p>
          <Button
            variant="secondary"
            onClick={() => setCreateOpen(true)}
            size="sm"
          >
            <Plus className="w-4 h-4" /> Create your first team
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team.teamId}
              team={team}
              currentUserId={user?.uid ?? ""}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CreateTeamModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinTeamModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  );
}
