"use client";
import { useEffect, useState } from "react";
import {
  subscribeToTeamMembersWithProfiles,
  type MemberProfile,
} from "@/lib/firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import type { TeamRole } from "@/types";

export function useTeamMembers(teamId: string | null) {
  const { user, getToken } = useAuth();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToTeamMembersWithProfiles(teamId, (profiles) => {
      setMembers(profiles);
      setLoading(false);
    });
    return unsub;
  }, [teamId]);

  /** Role of the currently signed-in user in this team */
  const myRole: TeamRole | null =
    members.find((m) => m.userId === user?.uid)?.role ?? null;

  /** Owner-only: change another member's role to 'admin' or 'member' */
  async function updateMemberRole(
    userId: string,
    role: "admin" | "member",
  ): Promise<void> {
    if (!teamId) throw new Error("No team selected");
    const token = await getToken();
    const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to update role");
  }

  /** Owner/admin only: kick a member from the team */
  async function kickMember(userId: string): Promise<void> {
    if (!teamId) throw new Error("No team selected");
    const token = await getToken();
    const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to kick member");
  }

  return { members, loading, myRole, updateMemberRole, kickMember };
}
