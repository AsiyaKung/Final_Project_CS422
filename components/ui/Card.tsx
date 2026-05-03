"use client";
import React from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  neon?: "cyan" | "violet" | false;
}

export function Card({
  className,
  children,
  hover = false,
  neon = false,
}: CardProps) {
  const neonClass =
    neon === "cyan"
      ? "border-neon-400/30 shadow-neon-cyan"
      : neon === "violet"
        ? "border-violet-500/30 shadow-neon-violet"
        : "";

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-md shadow-glass",
        "animate-fade-in-up",
        hover && "transition-transform duration-150 hover:-translate-y-0.5",
        neonClass,
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}
export function CardHeader({ className, children }: CardHeaderProps) {
  return (
    <div className={cn("px-5 pt-5 pb-3 border-b border-white/8", className)}>
      {children}
    </div>
  );
}

export function CardBody({ className, children }: CardHeaderProps) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function CardFooter({ className, children }: CardHeaderProps) {
  return (
    <div className={cn("px-5 pb-5 pt-3 border-t border-white/8", className)}>
      {children}
    </div>
  );
}
