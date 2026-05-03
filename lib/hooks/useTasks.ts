"use client";
// Custom hook – real-time task subscription for a team.
import { useEffect, useState } from "react";
import { subscribeToTeamTasks } from "@/lib/firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Task, CreateTaskPayload, UpdateTaskPayload } from "@/types";

export function useTasks(teamId: string | null) {
  const { getToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Live subscription via Firestore onSnapshot
  useEffect(() => {
    if (!teamId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToTeamTasks(teamId, (t) => {
      setTasks(t);
      setLoading(false);
    });
    return unsub;
  }, [teamId]);

  // ── Mutators (call the Next.js API routes) ──────────────────

  async function createTask(payload: CreateTaskPayload): Promise<void> {
    const token = await getToken();
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      let errorMsg = `Failed to create task (HTTP ${res.status})`;
      try {
        const body = await res.json();
        errorMsg = body.error ?? errorMsg;
      } catch {
        // response was not JSON (e.g. Vercel 500 HTML page)
      }
      throw new Error(errorMsg);
    }
  }

  async function updateTask(
    taskId: string,
    payload: UpdateTaskPayload,
  ): Promise<void> {
    const token = await getToken();
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      let errorMsg = `Failed to update task (HTTP ${res.status})`;
      try {
        const body = await res.json();
        errorMsg = body.error ?? errorMsg;
      } catch {
        // response was not JSON (e.g. Vercel 500 HTML page)
      }
      throw new Error(errorMsg);
    }
  }

  async function deleteTask(taskId: string): Promise<void> {
    const token = await getToken();
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      let errorMsg = `Failed to delete task (HTTP ${res.status})`;
      try {
        const body = await res.json();
        errorMsg = body.error ?? errorMsg;
      } catch {
        // response was not JSON (e.g. Vercel 500 HTML page)
      }
      throw new Error(errorMsg);
    }
  }

  return { tasks, loading, createTask, updateTask, deleteTask };
}
