"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import {
  createTaskSchema,
  type CreateTaskInput,
} from "@/lib/validations/schemas";
import { useTasks } from "@/lib/hooks/useTasks";
import { useTeamMembers } from "@/lib/hooks/useTeamMembers";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
}

export function CreateTaskModal({
  open,
  onClose,
  teamId,
}: CreateTaskModalProps) {
  const { createTask } = useTasks(teamId);
  const { members } = useTeamMembers(teamId);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { teamId },
  });

  const onSubmit = async (data: CreateTaskInput) => {
    setLoading(true);
    try {
      await createTask({
        ...data,
        teamId,
        assignedTo: data.assignedTo ?? undefined,
      });
      toast.success("Task created!");
      reset({ teamId });
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Task">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <input type="hidden" {...register("teamId")} />

        <Input
          label="Title"
          placeholder="Fix the authentication bug"
          error={errors.title?.message}
          {...register("title")}
        />
        <Textarea
          label="Description"
          placeholder="Optional details about the task…"
          error={errors.description?.message}
          {...register("description")}
        />

        {/* Assign to — dropdown of team members */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-dark-200">Assign To</label>
          <select
            {...register("assignedTo")}
            className="w-full rounded-xl bg-dark-800 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-neon-400/40 focus:border-neon-400/40 transition-colors"
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

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
