"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { joinTeamSchema, type JoinTeamInput } from "@/lib/validations/schemas";
import { useTeams } from "@/lib/hooks/useTeams";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface JoinTeamModalProps {
  open: boolean;
  onClose: () => void;
}

export function JoinTeamModal({ open, onClose }: JoinTeamModalProps) {
  const { joinTeam } = useTeams();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JoinTeamInput>({ resolver: zodResolver(joinTeamSchema) });

  const onSubmit = async (data: JoinTeamInput) => {
    setLoading(true);
    try {
      const team = await joinTeam(data);
      toast.success(`Joined team "${team.name}"!`);
      reset();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Invalid invite code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Join a Team">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <Input
          label="Invite Code"
          placeholder="e.g. ABC12XYZ"
          hint="Ask your team owner for the invite code."
          error={errors.inviteCode?.message}
          {...register("inviteCode")}
        />

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" loading={loading}>
            Join Team
          </Button>
        </div>
      </form>
    </Modal>
  );
}
