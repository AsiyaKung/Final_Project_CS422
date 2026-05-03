"use client";
import { useState, useRef } from "react";
import { Trash2, User, Clock, GripVertical, Pencil } from "lucide-react";
import { format } from "date-fns";

import { Card, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EditTaskModal } from "./EditTaskModal";
import type { Task, TaskStatus } from "@/types";

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  currentUserId: string;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  /** Touch-specific callbacks so TaskBoard can detect the drop column */
  onTouchMove?: (x: number, y: number) => void;
  onTouchDrop?: (x: number, y: number) => void;
}

const nextStatus: Record<TaskStatus, TaskStatus> = {
  pending: "in_progress",
  in_progress: "done",
  done: "pending",
};

const nextStatusLabel: Record<TaskStatus, string> = {
  pending: "Start",
  in_progress: "Complete",
  done: "Reopen",
};

export function TaskCard({
  task,
  onStatusChange,
  onDelete,
  currentUserId,
  onDragStart,
  onDragEnd,
  onTouchMove,
  onTouchDrop,
}: TaskCardProps) {
  const isOwner = task.createdBy === currentUserId;
  const [editOpen, setEditOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);

  const createdAt =
    task.createdAt instanceof Date
      ? task.createdAt
      : ((task.createdAt as { toDate?: () => Date }).toDate?.() ?? new Date());

  // ── Touch drag handlers ────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const ghost = cardRef.current.cloneNode(true) as HTMLDivElement;
      ghost.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        opacity: 0.85;
        pointer-events: none;
        z-index: 9999;
        transform: scale(1.04) rotate(1.5deg);
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        transition: none;
        border-radius: 16px;
      `;
      document.body.appendChild(ghost);
      ghostRef.current = ghost;
    }
    onDragStart(task.taskId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // prevent page scroll while dragging
    const touch = e.touches[0];
    if (ghostRef.current) {
      const w = ghostRef.current.offsetWidth;
      ghostRef.current.style.top = `${touch.clientY - 40}px`;
      ghostRef.current.style.left = `${touch.clientX - w / 2}px`;
    }
    onTouchMove?.(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (ghostRef.current) {
      document.body.removeChild(ghostRef.current);
      ghostRef.current = null;
    }
    const touch = e.changedTouches[0];
    onTouchDrop?.(touch.clientX, touch.clientY);
    onDragEnd();
  };

  return (
    <>
      <div
        ref={cardRef}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          onDragStart(task.taskId);
        }}
        onDragEnd={onDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "none" }}
        className="cursor-grab active:cursor-grabbing active:opacity-60 active:scale-95 transition-[opacity,transform] duration-150"
      >
        <Card hover className="group">
          <CardBody className="flex flex-col gap-3">
            {/* Title + status badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <GripVertical className="w-3.5 h-3.5 text-dark-600 shrink-0 group-hover:text-dark-400 transition-colors" />
                <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-neon-300 transition-colors truncate">
                  {task.title}
                </h3>
              </div>
              <StatusBadge status={task.status} />
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-xs text-dark-400 leading-relaxed line-clamp-3">
                {task.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-3 text-xs text-dark-500">
              {task.assignedTo && (
                <span className="flex items-center gap-1 truncate">
                  <User className="w-3 h-3 shrink-0" />
                  <span className="truncate">{task.assignedTo}</span>
                </span>
              )}
              <span className="flex items-center gap-1 ml-auto shrink-0">
                <Clock className="w-3 h-3" />
                {format(createdAt, "MMM d")}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/6">
              <Button
                size="sm"
                variant={task.status === "done" ? "ghost" : "primary"}
                className="flex-1 text-xs"
                onClick={() =>
                  onStatusChange(task.taskId, nextStatus[task.status])
                }
              >
                {nextStatusLabel[task.status]}
              </Button>

              {/* Edit button — any team member can edit */}
              <Button
                size="sm"
                variant="ghost"
                className="px-2 text-dark-400 hover:text-neon-300"
                onClick={() => setEditOpen(true)}
                title="Edit task"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>

              {isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="px-2 text-dark-400 hover:text-red-400"
                  onClick={() => onDelete(task.taskId)}
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <EditTaskModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        task={task}
        teamId={task.teamId}
      />
    </>
  );
}
