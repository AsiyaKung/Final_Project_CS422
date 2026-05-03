"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import {
  createTeamSchema,
  type CreateTeamInput,
} from "@/lib/validations/schemas";
import { useTeams } from "@/lib/hooks/useTeams";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface CreateTeamModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTeamModal({ open, onClose }: CreateTeamModalProps) {
  const { createTeam } = useTeams();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTeamInput>({ resolver: zodResolver(createTeamSchema) });

  const onSubmit = async (data: CreateTeamInput) => {
    setLoading(true);
    try {
      const team = await createTeam(data);
      toast.success(`Team "${team.name}" created!`);
      reset();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Team">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <Input
          label="Team Name"
          placeholder="Engineering Crew"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Discord Webhook URL"
          type="url"
          placeholder="https://discord.com/api/webhooks/…"
          hint="Notifications will be posted to this channel."
          error={errors.webhookUrl?.message}
          {...register("webhookUrl")}
        />

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" loading={loading}>
            Create Team
          </Button>
        </div>
      </form>
    </Modal>
  );
}
