"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import {
  updateTaskSchema,
  type UpdateTaskInput,
} from "@/lib/validations/schemas";
import { useTasks } from "@/lib/hooks/useTasks";
import { useTeamMembers } from "@/lib/hooks/useTeamMembers";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Task, TaskStatus } from "@/types";

interface EditTaskModalProps {
  open: boolean;
  onClose: () => void;
  task: Task;
  teamId: string;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export function EditTaskModal({
  open,
  onClose,
  task,
  teamId,
}: EditTaskModalProps) {
  const { updateTask } = useTasks(teamId);
  const { members } = useTeamMembers(teamId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema),
  });

  // Sync form with task data whenever the modal opens
  useEffect(() => {
    if (open) {
      reset({
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        assignedTo: task.assignedTo ?? undefined,
      });
    }
  }, [open, task, reset]);

  const onSubmit = async (data: UpdateTaskInput) => {
    try {
      await updateTask(task.taskId, {
        ...data,
        assignedTo: data.assignedTo || null,
      });
      toast.success("Task updated!");
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update task");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Task">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <Input
          label="Title"
          error={errors.title?.message}
          {...register("title")}
        />

        <Textarea
          label="Description"
          placeholder="Optional details…"
          error={errors.description?.message}
          {...register("description")}
        />

        {/* Assign to — dropdown of team members */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-dark-200">
            Assigned To
          </label>
          <select
            {...register("assignedTo")}
            className="w-full rounded-xl bg-dark-800 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-neon-400/40 focus:border-neon-400/40 transition-colors appearance-none cursor-pointer"
          >
            <option value="">— Unassigned —</option>
            {members.map((m) => (
              <option key={m.userId} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
          {errors.assignedTo?.message && (
            <p className="text-xs text-red-400">{errors.assignedTo.message}</p>
          )}
        </div>

        {/* Status selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-dark-200">Status</label>
          <select
            {...register("status")}
            className="w-full rounded-xl bg-dark-800 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-neon-400/40 focus:border-neon-400/40 transition-colors appearance-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-dark-900 text-white"
              >
                {opt.label}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="text-xs text-red-400">⚠ {errors.status.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!isDirty}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
