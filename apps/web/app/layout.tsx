import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chat Platform",
  description: "Real-time workspace communication platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
