"use client";
import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, ClipboardList, Filter, X } from "lucide-react";
import toast from "react-hot-toast";

import { useTasks } from "@/lib/hooks/useTasks";
import { useAuth } from "@/components/providers/AuthProvider";
import { TaskCard } from "./TaskCard";
import { CreateTaskModal } from "./CreateTaskModal";
import { Button } from "@/components/ui/Button";
import type { TaskStatus } from "@/types";

interface TaskBoardProps {
  teamId: string;
  teamName: string;
  /** If false, the "New Task" button is hidden (member role) */
  canCreateTask?: boolean;
}

const COLUMNS: {
  status: TaskStatus;
  label: string;
  border: string;
  activeBg: string;
  dropLabel: string;
}[] = [
  {
    status: "pending",
    label: "Pending",
    border: "border-amber-500/30",
    activeBg: "bg-amber-500/10 border-amber-500/60",
    dropLabel: "Drop to set Pending",
  },
  {
    status: "in_progress",
    label: "In Progress",
    border: "border-neon-400/30",
    activeBg: "bg-neon-400/10 border-neon-400/60",
    dropLabel: "Drop to start",
  },
  {
    status: "done",
    label: "Done",
    border: "border-emerald-500/30",
    activeBg: "bg-emerald-500/10 border-emerald-500/60",
    dropLabel: "Drop to complete ✅",
  },
];

export function TaskBoard({
  teamId,
  teamName,
  canCreateTask = true,
}: TaskBoardProps) {
  const { user } = useAuth();
  const { tasks, loading, updateTask, deleteTask } = useTasks(teamId);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const draggingTaskId = useRef<string | null>(null);

  // Collect unique non-null assignedTo values across all tasks
  const assignees = [
    ...new Set(tasks.map((t) => t.assignedTo).filter(Boolean)),
  ] as string[];

  // Apply assignee filter
  const visibleTasks = filterAssignee
    ? tasks.filter((t) => t.assignedTo === filterAssignee)
    : tasks;

  // ── Handlers ───────────────────────────────────────────────

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTask(taskId, { status });
      if (status === "done") toast.success("Task marked complete! 🎉");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update task");
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast.success("Task deleted.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete task");
    }
  };

  // ── Drag & Drop ─────────────────────────────────────────────

  const handleDragStart = (taskId: string) => {
    draggingTaskId.current = taskId;
  };

  const handleDragEnd = () => {
    draggingTaskId.current = null;
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the column container, not a child element
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOverCol(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = draggingTaskId.current;
    if (!taskId) return;
    const task = tasks.find((t) => t.taskId === taskId);
    if (!task || task.status === targetStatus) return;
    await handleStatusChange(taskId, targetStatus);
  };

  // ── Touch helpers ────────────────────────────────────────────

  /** Returns the TaskStatus of the column element currently under (x, y), or null. */
  const getColAtPoint = (x: number, y: number): TaskStatus | null => {
    const els = document.elementsFromPoint(x, y);
    for (const el of els) {
      const col = (el as HTMLElement).closest("[data-col-status]");
      if (col) return (col as HTMLElement).dataset.colStatus as TaskStatus;
    }
    return null;
  };

  const handleTouchMove = (x: number, y: number) => {
    const col = getColAtPoint(x, y);
    setDragOverCol(col);
  };

  const handleTouchDrop = async (x: number, y: number) => {
    const targetStatus = getColAtPoint(x, y);
    setDragOverCol(null);
    const taskId = draggingTaskId.current;
    if (!taskId || !targetStatus) {
      draggingTaskId.current = null;
      return;
    }
    const task = tasks.find((t) => t.taskId === taskId);
    draggingTaskId.current = null;
    if (!task || task.status === targetStatus) return;
    await handleStatusChange(taskId, targetStatus);
  };

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{teamName}</h2>
          <p className="text-sm text-dark-400 mt-0.5">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
            {filterAssignee && (
              <span className="ml-1 text-neon-400">
                · showing {visibleTasks.length} for "{filterAssignee}"
              </span>
            )}
          </p>
        </div>
        {canCreateTask && (
          <Button onClick={() => setCreateOpen(true)} size="md">
            <Plus className="w-4 h-4" /> New Task
          </Button>
        )}
      </div>

      {/* Filter bar — only shown when tasks have assignees */}
      {assignees.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap bg-white/[0.02] border border-white/8 rounded-xl px-3 py-2">
          <Filter className="w-3.5 h-3.5 text-dark-400 shrink-0" />
          <span className="text-xs text-dark-400">Filter by assignee:</span>

          <button
            onClick={() => setFilterAssignee(null)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filterAssignee === null
                ? "bg-neon-400/20 border-neon-400/50 text-neon-300"
                : "bg-white/5 border-white/10 text-dark-400 hover:text-white hover:border-white/20"
            }`}
          >
            All ({tasks.length})
          </button>

          {assignees.map((a) => {
            const count = tasks.filter((t) => t.assignedTo === a).length;
            return (
              <button
                key={a}
                onClick={() =>
                  setFilterAssignee(a === filterAssignee ? null : a)
                }
                className={`text-xs px-3 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${
                  filterAssignee === a
                    ? "bg-neon-400/20 border-neon-400/50 text-neon-300"
                    : "bg-white/5 border-white/10 text-dark-400 hover:text-white hover:border-white/20"
                }`}
              >
                {a}
                <span className="opacity-60">({count})</span>
                {filterAssignee === a && <X className="w-2.5 h-2.5" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Kanban columns */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((c) => (
            <div
              key={c.status}
              className="rounded-2xl bg-white/3 h-64 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-auto pb-4">
          {COLUMNS.map(({ status, label, border, activeBg, dropLabel }) => {
            const colTasks = visibleTasks.filter((t) => t.status === status);
            const isDragOver = dragOverCol === status;

            return (
              <div
                key={status}
                data-col-status={status}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status)}
                className={`rounded-2xl border p-3 flex flex-col gap-3 transition-all duration-150 ${
                  isDragOver ? activeBg : `bg-white/[0.02] ${border}`
                }`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-dark-400">
                    {label}
                  </span>
                  <span className="text-xs bg-white/8 text-dark-300 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                {/* Task cards */}
                <div className="flex flex-col gap-3">
                  <AnimatePresence mode="wait">
                    {colTasks.length === 0 ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`flex flex-col items-center justify-center py-10 gap-2 rounded-xl border-2 border-dashed transition-colors ${
                          isDragOver
                            ? "border-current text-white/60"
                            : "border-white/8 text-dark-600"
                        }`}
                      >
                        <ClipboardList className="w-6 h-6" />
                        <span className="text-xs text-center px-2">
                          {isDragOver ? dropLabel : "Empty"}
                        </span>
                      </motion.div>
                    ) : (
                      colTasks.map((task) => (
                        <motion.div
                          key={task.taskId}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                        >
                          <TaskCard
                            task={task}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDelete}
                            currentUserId={user?.uid ?? ""}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onTouchMove={handleTouchMove}
                            onTouchDrop={handleTouchDrop}
                          />
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>

                  {/* Drop zone hint — shown when dragging over a non-empty column */}
                  {isDragOver && colTasks.length > 0 && (
                    <div className="rounded-xl border-2 border-dashed border-current py-3 text-center text-xs text-white/50">
                      {dropLabel}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        teamId={teamId}
      />
    </div>
  );
}
