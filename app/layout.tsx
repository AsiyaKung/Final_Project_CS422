import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TaskFlow – Team Smart Task System",
  description:
    "Collaborative task management with IoT, Node-RED & Discord integration.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#12122a",
                color: "#e2e8f0",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: "13px",
              },
              success: {
                iconTheme: { primary: "#00d4ff", secondary: "#12122a" },
              },
              error: {
                iconTheme: { primary: "#f87171", secondary: "#12122a" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
