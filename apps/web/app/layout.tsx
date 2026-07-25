import type { Metadata } from "next";
import * as Sentry from "@sentry/nextjs";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { AuthProvider } from "@/components/auth/auth-context";
import { AppHeader } from "@/components/app-header";
import { ThemeProvider } from "@chat/ui";
import { PWAProvider } from "@/components/pwa/pwa-provider";
import { VersionBadge } from "@/components/version-badge";
import { CookieBanner } from "@/components/cookie-banner";
import { KeyboardShortcuts } from "@/components/shared/keyboard-shortcuts";
import { ToastProvider } from "@chat/ui/components/toast";
import { I18nProvider } from "@/components/i18n-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "MaineCyberTech Chat",
  description: "Real-time workspace communication platform",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MaineCyberTech Chat",
  },
};

export const viewport = {
  themeColor: "#ffffff",
};

const themeScript = `
(function(){var t=localStorage.getItem("chat-theme")||"system";if(t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")})()`;

const viewportScript =
  "!function(){function u(){var v=window.visualViewport;if(v){document.documentElement.style.setProperty('--vh',(v.height/100)+'px')}else{var h=window.innerHeight;document.documentElement.style.setProperty('--vh',(h/100)+'px')}}u();if(window.visualViewport){window.visualViewport.addEventListener('resize',u)}else{window.addEventListener('resize',u)}window.addEventListener('orientationchange',function(){setTimeout(u,100)})}()";

const localeScript =
  "!function(){var l=localStorage.getItem('chat-locale')||(navigator.language||'en').slice(0,5);var m={es:1,fr:1,de:1,'pt-BR':1,ja:1};if(m[l])document.documentElement.setAttribute('lang',l);else document.documentElement.setAttribute('lang','en');localStorage.setItem('chat-locale',document.documentElement.lang)}()";

const reducedMotionScript =
  "!function(){var m=window.matchMedia('(prefers-reduced-motion:reduce)');if(m.matches)document.documentElement.setAttribute('data-reduced-motion','true');m.addEventListener('change',function(e){if(e.matches)document.documentElement.setAttribute('data-reduced-motion','true');else document.documentElement.removeAttribute('data-reduced-motion')})}()";

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
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MaineCyberTech Chat" />
        <style>{"html,body{background:#fff}html.dark,body.dark{background:#1a1a1a}"}</style>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: viewportScript }} />
        <script dangerouslySetInnerHTML={{ __html: localeScript }} />
        <script dangerouslySetInnerHTML={{ __html: reducedMotionScript }} />
      </head>
      <body
        className="flex h-screen min-h-0 flex-col overflow-hidden antialiased"
        style={{ height: "calc(var(--vh, 1vh) * 100)" }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-[var(--center-channel-bg)] focus:p-4 focus:text-[var(--center-channel-color)]"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <I18nProvider>
            <PWAProvider>
              <AuthProvider>
                <ToastProvider>
                  <AppHeader />
                  <ErrorBoundary>
                    <main id="main-content" className="flex min-h-0 flex-1 flex-col">
                      {children}
                    </main>
                  </ErrorBoundary>
                  <VersionBadge />
                  <CookieBanner />
                  <KeyboardShortcuts />
                </ToastProvider>
              </AuthProvider>
            </PWAProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
