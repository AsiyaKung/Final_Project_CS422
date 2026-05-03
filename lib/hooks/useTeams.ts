"use client";
// Custom hook – real-time team subscription for the current user.
import { useEffect, useState } from "react";
import { subscribeToUserTeams } from "@/lib/firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Team, CreateTeamPayload, JoinTeamPayload } from "@/types";

export function useTeams() {
  const { user, getToken } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Live subscription – updates automatically as membership changes
  useEffect(() => {
    if (!user) {
      setTeams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToUserTeams(user.uid, (t) => {
      setTeams(t);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  // ── Mutators ────────────────────────────────────────────────

  async function createTeam(payload: CreateTeamPayload): Promise<Team> {
    const token = await getToken();
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to create team");
    return body.data as Team;
  }

  async function joinTeam(payload: JoinTeamPayload): Promise<Team> {
    const token = await getToken();
    const res = await fetch("/api/teams/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to join team");
    return body.data as Team;
  }

  async function deleteTeam(teamId: string): Promise<void> {
    const token = await getToken();
    const res = await fetch(`/api/teams/${teamId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "Failed to delete team");
    }
  }

  return { teams, loading, createTeam, joinTeam, deleteTeam };
}
