"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Mail, Lock, Zap, Eye, EyeOff, User } from "lucide-react";
import toast from "react-hot-toast";

import { loginSchema, type LoginInput } from "@/lib/validations/schemas";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      await login(data);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Login failed. Check your credentials.";
      if (msg.includes("No account found with that username")) {
        toast.error("No account found with that username.");
      } else if (
        msg.includes("invalid-credential") ||
        msg.includes("wrong-password")
      ) {
        toast.error("Invalid username/email or password.");
      } else if (msg.includes("too-many-requests")) {
        toast.error("Too many attempts. Please wait and try again.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      {/* Logo mark */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-neon-400/10 border border-neon-400/20">
          <Zap className="w-6 h-6 text-neon-400" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">
          TaskFlow
        </span>
      </div>

      <h1 className="text-3xl font-bold text-white mb-1">Welcome back</h1>
      <p className="text-dark-400 mb-8 text-sm">Sign in to your workspace</p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5"
      >
        <Input
          label="Username or Email"
          type="text"
          autoComplete="username"
          placeholder="yourname or you@example.com"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.identifier?.message}
          {...register("identifier")}
        />
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="hover:text-white transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
          error={errors.password?.message}
          {...register("password")}
        />

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="w-full mt-2"
        >
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-dark-400">
        No account?{" "}
        <Link
          href="/register"
          className="text-neon-400 hover:text-neon-300 font-medium transition-colors"
        >
          Create one free
        </Link>
      </p>
    </motion.div>
  );
}
