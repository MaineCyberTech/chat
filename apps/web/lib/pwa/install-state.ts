"use client";

import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface WindowWithMSStream extends Window {
  MSStream?: unknown;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    const isInWebAppiOS = (navigator as NavigatorWithStandalone).standalone === true;

    setIsInstalled(isStandalone || (isIOS && isInWebAppiOS));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  const getPlatform = useCallback(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) && !(window as WindowWithMSStream).MSStream) return "ios";
    if (/Android/.test(ua)) return "android";
    if (/Mac/.test(ua)) return "macos";
    if (/Windows/.test(ua)) return "windows";
    if (/Linux/.test(ua)) return "linux";
    return "unknown";
  }, []);

  const getInstallInstructions = useCallback(() => {
    const platform = getPlatform();

    switch (platform) {
      case "ios":
        return {
          title: "Install on iOS",
          steps: [
            "Tap the Share button (square with arrow up)",
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" in the top right corner',
          ],
          showButton: false,
        };
      case "android":
        return {
          title: "Install on Android",
          steps: [
            "Tap the menu (three dots) in Chrome",
            'Select "Install app" or "Add to Home screen"',
            'Tap "Install" to confirm',
          ],
          showButton: true,
        };
      case "macos":
      case "windows":
      case "linux":
        return {
          title: `Install on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
          steps: [
            "Click the install icon in the address bar",
            'Or use the menu → "Install Chat Platform"',
            "Confirm the installation",
          ],
          showButton: true,
        };
      default:
        return {
          title: "Install App",
          steps: [
            "Use your browser's install option",
            "Look for an install icon in the address bar",
            'Or check the browser menu for "Install"',
          ],
          showButton: true,
        };
    }
  }, [getPlatform]);

  return {
    deferredPrompt,
    isInstallable,
    isInstalled,
    install,
    getPlatform,
    getInstallInstructions,
  };
}

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      setIsSupported(true);

      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          setRegistration(reg);

          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.error("Service worker registration failed:", err);
        });

      // Listen for controller change (update applied)
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }
  }, []);

  const applyUpdate = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage("skipWaiting");
    }
  }, [registration]);

  const checkForUpdate = useCallback(() => {
    registration?.update();
  }, [registration]);

  return {
    registration,
    updateAvailable,
    isSupported,
    applyUpdate,
    checkForUpdate,
  };
}
