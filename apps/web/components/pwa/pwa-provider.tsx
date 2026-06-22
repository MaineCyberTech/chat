"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useInstallPrompt } from "@/lib/pwa/install-state";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { UpdateNotification } from "@/components/pwa/update-notification";
import { NotificationPrompt } from "@/components/pwa/notification-prompt";

interface PWAContextType {
  showInstallPrompt: () => void;
  hideInstallPrompt: () => void;
  isInstallPromptOpen: boolean;
  showNotificationPrompt: () => void;
  hideNotificationPrompt: () => void;
  isNotificationPromptOpen: boolean;
}

const PWAContext = createContext<PWAContextType | null>(null);

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const { isInstalled } = useInstallPrompt();
  const [isInstallPromptOpen, setIsInstallPromptOpen] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);
  const [isNotificationPromptOpen, setIsNotificationPromptOpen] = useState(false);

  // Auto-show install prompt on first visit (optional - can be triggered manually instead)
  useEffect(() => {
    // Only auto-prompt if installable, not installed, and user hasn't been prompted yet
    // Disabled by default - let users discover install via UI
    // if (isInstallable && !isInstalled && !hasPrompted) {
    //   const timer = setTimeout(() => {
    //     setIsInstallPromptOpen(true);
    //     setHasPrompted(true);
    //   }, 30000); // 30 seconds after load
    //   return () => clearTimeout(timer);
    // }
  }, [isInstalled, hasPrompted]);

  const showInstallPrompt = useCallback(() => {
    setIsInstallPromptOpen(true);
    setHasPrompted(true);
  }, []);

  const hideInstallPrompt = useCallback(() => {
    setIsInstallPromptOpen(false);
  }, []);

  const showNotificationPrompt = useCallback(() => {
    setIsNotificationPromptOpen(true);
  }, []);

  const hideNotificationPrompt = useCallback(() => {
    setIsNotificationPromptOpen(false);
  }, []);

  return (
    <PWAContext.Provider
      value={{
        showInstallPrompt,
        hideInstallPrompt,
        isInstallPromptOpen,
        showNotificationPrompt,
        hideNotificationPrompt,
        isNotificationPromptOpen,
      }}
    >
      {children}
      <InstallPrompt isOpen={isInstallPromptOpen} onClose={hideInstallPrompt} />
      <NotificationPrompt isOpen={isNotificationPromptOpen} onClose={hideNotificationPrompt} />
      <UpdateNotification />
    </PWAContext.Provider>
  );
}
