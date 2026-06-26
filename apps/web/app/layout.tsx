import type { Metadata } from "next";
import * as Sentry from "@sentry/nextjs";
import { AuthProvider } from "@/components/auth/auth-context";
import { AppHeader } from "@/components/app-header";
import { ThemeProvider } from "@chat/ui";
import { PWAProvider } from "@/components/pwa/pwa-provider";
import { VersionBadge } from "@/components/version-badge";
import { ToastProvider } from "@chat/ui/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chat Platform",
  description: "Real-time workspace communication platform",
  manifest: "/manifest.webmanifest",
  themeColor: "#0a0a0a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chat Platform",
  },
};

const themeScript = `
(function(){var t=localStorage.getItem("chat-theme")||"system";if(t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")})()`;

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 0.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: dark)" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Chat Platform" />
      </head>
      <body className="min-h-screen antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-[var(--color-background-primary)] focus:p-4 focus:text-[var(--color-foreground-primary)]"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <PWAProvider>
            <AuthProvider>
              <ToastProvider>
                <AppHeader />
                <main id="main-content" className="min-h-[calc(100vh-4rem)]">
                  {children}
                </main>
                <VersionBadge />
              </ToastProvider>
            </AuthProvider>
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
