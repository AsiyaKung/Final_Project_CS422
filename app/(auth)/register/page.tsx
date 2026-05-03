import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = { title: "Register – TaskFlow" };

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-dark-950 bg-hero-pattern flex items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-violet-600/6 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-neon-400/6 blur-3xl" />
      </div>
      <RegisterForm />
    </main>
  );
}
