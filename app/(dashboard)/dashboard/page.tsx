"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Zap, Users, ClipboardList, Send } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/components/providers/AuthProvider";
import { useTeams } from "@/lib/hooks/useTeams";
import { useTasks } from "@/lib/hooks/useTasks";
import { useTeamMembers } from "@/lib/hooks/useTeamMembers";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { TeamMembersPanel } from "@/components/dashboard/TeamMembersPanel";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  const { user, getToken } = useAuth();
  const { teams, loading: teamsLoading } = useTeams();
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [sendingReport, setSendingReport] = useState(false);
  const { tasks } = useTasks(activeTeamId);

  const activeTeam = teams.find((t) => t.teamId === activeTeamId);
  const {
    members,
    loading: membersLoading,
    myRole,
  } = useTeamMembers(activeTeamId);

  // Team-scoped task stats
  const teamDone = tasks.filter((t) => t.status === "done").length;
  const teamTotal = tasks.length;
  const teamPct =
    teamTotal === 0 ? 0 : Math.round((teamDone / teamTotal) * 100);

  // Send Discord report handler
  const handleDiscordReport = async () => {
    if (!activeTeamId) return;
    setSendingReport(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/teams/${activeTeamId}/discord-report`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to send");
      toast.success("ส่งรายงานไปที่ Discord แล้ว! 🎉");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "ส่งไม่สำเร็จ");
    } finally {
      setSendingReport(false);
    }
  };

  // Stat cards
  const stats = [
    {
      label: "Total Teams",
      value: teams.length,
      icon: Users,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Total Tasks",
      value: tasks.length,
      icon: ClipboardList,
      color: "text-neon-400",
      bg: "bg-neon-400/10",
    },
    {
      label: "Completed",
      value: tasks.filter((t) => t.status === "done").length,
      icon: Zap,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <LayoutDashboard className="w-5 h-5 text-neon-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-neon-400">
            Dashboard
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Welcome back, {user?.displayName?.split(" ")[0] ?? "friend"} 👋
        </h1>
        <p className="text-dark-400 text-sm mt-1">
          Select a team below to view its task board.
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardBody className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-dark-400">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Team picker */}
      {!teamsLoading && teams.length > 0 && (
        <div>
          <p className="text-sm font-medium text-dark-300 mb-3">
            Select a Team
          </p>
          <div className="flex flex-wrap gap-2">
            {teams.map((team) => (
              <button
                key={team.teamId}
                onClick={() => setActiveTeamId(team.teamId)}
                className={[
                  "px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150",
                  activeTeamId === team.teamId
                    ? "bg-neon-400/15 border-neon-400/40 text-neon-300"
                    : "bg-white/4 border-white/8 text-dark-300 hover:bg-white/8 hover:text-white",
                ].join(" ")}
              >
                {team.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Task board + Members panel */}
      {activeTeam ? (
        <div className="flex flex-col gap-4">
          {/* Progress bar + Discord button row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white/3 border border-white/8 rounded-2xl px-5 py-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-dark-300 uppercase tracking-wider">
                  ความคืบหน้า — {activeTeam.name}
                </span>
                <span className="text-sm font-bold text-white">
                  {teamPct}%&nbsp;
                  <span className="text-dark-400 font-normal text-xs">
                    ({teamDone}/{teamTotal} งาน)
                  </span>
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-neon-400 to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${teamPct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDiscordReport}
              disabled={sendingReport || teamTotal === 0}
              className="flex-shrink-0 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {sendingReport ? "กำลังส่ง…" : "ส่งรายงานไป Discord"}
            </Button>
          </div>

          <TeamMembersPanel
            members={members}
            loading={membersLoading}
            teamName={activeTeam.name}
          />
          <TaskBoard
            teamId={activeTeam.teamId}
            teamName={activeTeam.name}
            canCreateTask={myRole === "owner" || myRole === "admin"}
          />
        </div>
      ) : (
        !teamsLoading && (
          <Card className="py-16 flex flex-col items-center justify-center text-center gap-3">
            <ClipboardList className="w-10 h-10 text-dark-600" />
            <p className="text-dark-400 text-sm">
              {teams.length === 0
                ? "Create or join a team to get started."
                : "Choose a team above to view its tasks."}
            </p>
          </Card>
        )
      )}
    </div>
  );
}
