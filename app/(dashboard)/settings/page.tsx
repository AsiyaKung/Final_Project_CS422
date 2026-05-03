"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Settings, User, KeyRound, ImageIcon, Mail } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/components/providers/AuthProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

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

// ── Sections ──────────────────────────────────────────────────

function ProfileSection() {
  const { user, updateDisplayName, updatePhotoURL } = useAuth();
  const [nameLoading, setNameLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  const nameForm = useForm<NameInput>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user?.displayName ?? "" },
  });

  const photoForm = useForm<PhotoInput>({
    resolver: zodResolver(photoSchema),
    defaultValues: { photoURL: user?.photoURL ?? "" },
  });

  const onSaveName = async ({ name }: NameInput) => {
    setNameLoading(true);
    try {
      await updateDisplayName(name);
      toast.success("Display name updated!");
      nameForm.reset({ name });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update name");
    } finally {
      setNameLoading(false);
    }
  };

  const onSavePhoto = async ({ photoURL }: PhotoInput) => {
    setPhotoLoading(true);
    try {
      await updatePhotoURL(photoURL);
      toast.success("Profile picture updated!");
      photoForm.reset({ photoURL });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update photo");
    } finally {
      setPhotoLoading(false);
    }
  };

  return (
    <Card>
      <CardBody className="flex flex-col gap-6">
        {/* Avatar + current info */}
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt="avatar"
              className="w-16 h-16 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-400 to-violet-600 flex items-center justify-center text-2xl font-bold text-dark-950">
              {user?.displayName?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <p className="text-white font-semibold text-lg">
              {user?.displayName ?? "—"}
            </p>
            <p className="text-dark-400 text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="border-t border-white/6" />

        {/* Display name */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <User className="w-4 h-4 text-neon-400" />
            Display Name
          </div>
          <form
            onSubmit={nameForm.handleSubmit(onSaveName)}
            className="flex gap-2"
          >
            <div className="flex-1">
              <Input
                placeholder="Your display name"
                error={nameForm.formState.errors.name?.message}
                {...nameForm.register("name")}
              />
            </div>
            <Button
              type="submit"
              loading={nameLoading}
              disabled={!nameForm.formState.isDirty || nameLoading}
            >
              Save
            </Button>
          </form>
        </div>

        <div className="border-t border-white/6" />

        {/* Photo URL */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <ImageIcon className="w-4 h-4 text-violet-400" />
            Profile Picture URL
          </div>
          <form
            onSubmit={photoForm.handleSubmit(onSavePhoto)}
            className="flex gap-2"
          >
            <div className="flex-1">
              <Input
                placeholder="https://example.com/avatar.png"
                error={photoForm.formState.errors.photoURL?.message}
                {...photoForm.register("photoURL")}
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              loading={photoLoading}
              disabled={!photoForm.formState.isDirty || photoLoading}
            >
              Save
            </Button>
          </form>
        </div>
      </CardBody>
    </Card>
  );
}

function SecuritySection() {
  const { changePassword, sendResetEmail } = useAuth();
  const [pwLoading, setPwLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordInput>({ resolver: zodResolver(passwordSchema) });

  const onChangePassword = async (data: PasswordInput) => {
    setPwLoading(true);
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
      setPwLoading(false);
    }
  };

  const handleResetEmail = async () => {
    setResetLoading(true);
    try {
      await sendResetEmail();
      toast.success("Password reset email sent! Check your inbox.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to send email");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Card>
      <CardBody className="flex flex-col gap-6">
        {/* Change password */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            Change Password
          </div>
          <form
            onSubmit={handleSubmit(onChangePassword)}
            className="flex flex-col gap-3"
          >
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
            <div>
              <Button type="submit" variant="secondary" loading={pwLoading}>
                Update Password
              </Button>
            </div>
          </form>
        </div>

        <div className="border-t border-white/6" />

        {/* Reset via email */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Mail className="w-4 h-4 text-amber-400" />
            Reset Password via Email
          </div>
          <p className="text-xs text-dark-400">
            Forgot your current password? We&apos;ll send a reset link to your
            registered email address.
          </p>
          <Button
            type="button"
            variant="ghost"
            loading={resetLoading}
            onClick={handleResetEmail}
          >
            Send Reset Email
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-neon-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-neon-400">
            Settings
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Account Settings
        </h1>
        <p className="text-dark-400 text-sm mt-1">
          Manage your profile, display name, and security options.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex flex-col gap-6"
      >
        <div>
          <h2 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3">
            Profile
          </h2>
          <ProfileSection />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3">
            Security
          </h2>
          <SecuritySection />
        </div>
      </motion.div>
    </div>
  );
}
