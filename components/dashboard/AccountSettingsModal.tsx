"use client";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { User, KeyRound, ImageIcon, Mail } from "lucide-react";

import { useAuth } from "@/components/providers/AuthProvider";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// ── Schemas ───────────────────────────────────────────────────

const nameSchema = z.object({
  name: z.string().min(1, "Name is required").max(64, "Max 64 chars"),
});
type NameInput = z.infer<typeof nameSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type PasswordInput = z.infer<typeof passwordSchema>;

const photoSchema = z.object({
  photoURL: z.string().url("Must be a valid URL").or(z.literal("")),
});
type PhotoInput = z.infer<typeof photoSchema>;

// ── Sub-sections ──────────────────────────────────────────────

function DisplayNameSection() {
  const { user, updateDisplayName } = useAuth();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<NameInput>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user?.displayName ?? "" },
  });

  const onSubmit = async ({ name }: NameInput) => {
    setLoading(true);
    try {
      await updateDisplayName(name);
      toast.success("Display name updated!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update name");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <User className="w-4 h-4 text-neon-400" />
        Display Name
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Your display name"
            error={errors.name?.message}
            {...register("name")}
          />
        </div>
        <Button type="submit" loading={loading} disabled={!isDirty || loading}>
          Save
        </Button>
      </form>
    </section>
  );
}

function PhotoURLSection() {
  const { user, updatePhotoURL } = useAuth();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<PhotoInput>({
    resolver: zodResolver(photoSchema),
    defaultValues: { photoURL: user?.photoURL ?? "" },
  });

  const onSubmit = async ({ photoURL }: PhotoInput) => {
    setLoading(true);
    try {
      await updatePhotoURL(photoURL);
      toast.success("Profile picture updated!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update photo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <ImageIcon className="w-4 h-4 text-violet-400" />
        Profile Picture URL
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="https://example.com/avatar.png"
            error={errors.photoURL?.message}
            {...register("photoURL")}
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          loading={loading}
          disabled={!isDirty || loading}
        >
          Save
        </Button>
      </form>
      {user?.photoURL && (
        <div className="flex items-center gap-3 mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.photoURL}
            alt="avatar preview"
            className="w-12 h-12 rounded-full object-cover border border-white/10"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="text-xs text-dark-400">Current photo</span>
        </div>
      )}
    </section>
  );
}

function ChangePasswordSection() {
  const { changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordInput>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (data: PasswordInput) => {
    setLoading(true);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      toast.success("Password changed!");
      reset();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to change password";
      toast.error(
        msg.includes("wrong-password") || msg.includes("invalid-credential")
          ? "Current password is incorrect"
          : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <KeyRound className="w-4 h-4 text-emerald-400" />
        Change Password
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Input
          type="password"
          label="Current Password"
          placeholder="••••••••"
          error={errors.currentPassword?.message}
          {...register("currentPassword")}
        />
        <Input
          type="password"
          label="New Password"
          placeholder="••••••••"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <Input
          type="password"
          label="Confirm New Password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" variant="secondary" loading={loading}>
          Update Password
        </Button>
      </form>
    </section>
  );
}

function ResetPasswordSection() {
  const { sendResetEmail } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      await sendResetEmail();
      toast.success("Password reset email sent! Check your inbox.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Mail className="w-4 h-4 text-amber-400" />
        Reset Password via Email
      </div>
      <p className="text-xs text-dark-400">
        Forgot your password? We&apos;ll send a reset link to your email.
      </p>
      <Button
        type="button"
        variant="ghost"
        loading={loading}
        onClick={handleReset}
      >
        Send Reset Email
      </Button>
    </section>
  );
}

// ── Main Modal ─────────────────────────────────────────────────

interface AccountSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function AccountSettingsModal({
  open,
  onClose,
}: AccountSettingsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Account Settings"
      className="max-w-lg"
    >
      <div className="flex flex-col gap-6">
        <DisplayNameSection />
        <div className="border-t border-white/6" />
        <PhotoURLSection />
        <div className="border-t border-white/6" />
        <ChangePasswordSection />
        <div className="border-t border-white/6" />
        <ResetPasswordSection />
      </div>
    </Modal>
  );
}
