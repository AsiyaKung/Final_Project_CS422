// Client-side Firestore helper functions
// These use the public Firebase SDK and run in the browser.
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";
import type { Task, Team, TeamMember, AppUser } from "@/types";

// ── Collection references ─────────────────────────────────────

export const usersCol = () => collection(db, "users");
export const teamsCol = () => collection(db, "teams");
export const membersCol = () => collection(db, "teamMembers");
export const tasksCol = () => collection(db, "tasks");

// ── User helpers ──────────────────────────────────────────────

export async function getUserById(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as AppUser) : null;
}

// ── Team helpers ──────────────────────────────────────────────

/**
 * Subscribe to teams the user belongs to.
 * Uses individual getDoc() per team instead of a list query to avoid
 * Firestore security rule issues with collection-level list operations.
 */
export function subscribeToUserTeams(
  userId: string,
  cb: (teams: Team[]) => void,
): Unsubscribe {
  const q = query(membersCol(), where("userId", "==", userId));
  return onSnapshot(
    q,
    async (snap) => {
      const teamIds = snap.docs.map((d) => d.data().teamId as string);
      if (teamIds.length === 0) {
        cb([]);
        return;
      }
      try {
        // Fetch each team document individually — avoids list-query rule issues.
        const teamDocs = await Promise.all(
          teamIds.slice(0, 30).map((id) => getDoc(doc(db, "teams", id))),
        );
        const teams = teamDocs
          .filter((d) => d.exists())
          .map((d) => {
            const data = d.data() as Team;
            // Strip webhook URL — never expose to the client.
            const { webhookUrl: _w, ...safe } = data;
            return safe as Team;
          });
        cb(teams);
      } catch (e) {
        console.error("[subscribeToUserTeams] failed to fetch teams:", e);
        cb([]);
      }
    },
    (err) => {
      console.error("[subscribeToUserTeams] snapshot error:", err);
      cb([]);
    },
  );
}

/** Subscribe to all members of a team. */
export function subscribeToTeamMembers(
  teamId: string,
  cb: (members: TeamMember[]) => void,
): Unsubscribe {
  const q = query(membersCol(), where("teamId", "==", teamId));
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => d.data() as TeamMember));
    },
    (err) => {
      console.error("[subscribeToTeamMembers] snapshot error:", err);
      cb([]);
    },
  );
}

/** Member profile — TeamMember + resolved AppUser data */
export interface MemberProfile {
  userId: string;
  role: TeamMember["role"];
  name: string;
  email: string;
  photoURL?: string;
}

/**
 * Subscribe to team members and resolve each member's display name.
 * Useful for building assignee dropdowns and the members panel.
 */
export function subscribeToTeamMembersWithProfiles(
  teamId: string,
  cb: (profiles: MemberProfile[]) => void,
): Unsubscribe {
  const q = query(membersCol(), where("teamId", "==", teamId));
  return onSnapshot(
    q,
    async (snap) => {
      const members = snap.docs.map((d) => d.data() as TeamMember);
      try {
        const profiles = await Promise.all(
          members.map(async (m) => {
            const userSnap = await getDoc(doc(db, "users", m.userId));
            const userData = userSnap.exists()
              ? (userSnap.data() as AppUser)
              : null;
            return {
              userId: m.userId,
              role: m.role,
              name: userData?.name || userData?.displayName || "Unknown",
              email: userData?.email ?? "",
              photoURL: userData?.photoURL,
            } as MemberProfile;
          }),
        );
        cb(profiles);
      } catch (e) {
        console.error("[subscribeToTeamMembersWithProfiles] error:", e);
        cb([]);
      }
    },
    (err) => {
      console.error(
        "[subscribeToTeamMembersWithProfiles] snapshot error:",
        err,
      );
      cb([]);
    },
  );
}

// ── Task helpers ──────────────────────────────────────────────

/** Real-time subscription to tasks for a given team. */
export function subscribeToTeamTasks(
  teamId: string,
  cb: (tasks: Task[]) => void,
): Unsubscribe {
  const q = query(tasksCol(), where("teamId", "==", teamId));
  return onSnapshot(
    q,
    (snap) => {
      const tasks = snap.docs
        .map((d) => d.data() as Task)
        .sort((a, b) => {
          const aMs =
            (
              a.createdAt as unknown as { toMillis?: () => number }
            )?.toMillis?.() ?? 0;
          const bMs =
            (
              b.createdAt as unknown as { toMillis?: () => number }
            )?.toMillis?.() ?? 0;
          return bMs - aMs;
        });
      cb(tasks);
    },
    (err) => {
      console.error("[subscribeToTeamTasks] snapshot error:", err);
      cb([]);
    },
  );
}
