"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Mail, Lock, User, Zap, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

import { registerSchema, type RegisterInput } from "@/lib/validations/schemas";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      await registerUser(data);
      toast.success("Account created! Welcome 🎉");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      if (msg.includes("email-already-in-use")) {
        toast.error("That email is already registered.");
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
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-neon-400/10 border border-neon-400/20">
          <Zap className="w-6 h-6 text-neon-400" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">
          TaskFlow
        </span>
      </div>

      <h1 className="text-3xl font-bold text-white mb-1">Create account</h1>
      <p className="text-dark-400 mb-8 text-sm">
        Start managing tasks with your team
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5"
      >
        <Input
          label="Full Name"
          type="text"
          autoComplete="name"
          placeholder="Ada Lovelace"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Min. 8 chars, upper + lower + number"
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
          hint="At least 8 characters with uppercase, lowercase, and a number."
          {...register("password")}
        />

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="w-full mt-2"
        >
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-dark-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-neon-400 hover:text-neon-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
