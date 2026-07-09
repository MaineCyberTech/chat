"use client";

import React, { useEffect, useState } from "react";
import { useInstallPrompt } from "@/lib/pwa/install-state";
import { Button, Dialog } from "@chat/ui";

interface InstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
}

export function InstallPrompt({ isOpen, onClose, userEmail }: InstallPromptProps) {
  const { isInstallable, isInstalled, install, getInstallInstructions } = useInstallPrompt();
  const [instructions, setInstructions] = useState<ReturnType<
    typeof getInstallInstructions
  > | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInstructions(getInstallInstructions());
    }
  }, [isOpen, getInstallInstructions]);

  if (!isOpen || isInstalled || !instructions) return null;

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title={instructions.title}>
      <div className="space-y-4">
        <div className="space-y-3">
          {instructions.steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3 text-sm">
              <span
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "rgba(var(--center-channel-color-rgb), 0.08)",
                  color: "var(--center-channel-color)",
                }}
              >
                {index + 1}
              </span>
              <p className="pt-0.5" style={{ color: "var(--text-secondary)" }}>
                {step}
              </p>
            </div>
          ))}
        </div>

        {instructions.showButton && isInstallable && (
          <Button variant="primary" className="w-full" onClick={handleInstall}>
            Install App
          </Button>
        )}

        {userEmail && !isInstallable && !instructions.showButton && (
          <p className="text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
            Already installed or using a browser that doesn't support installation prompts.
            {userEmail && " You're signed in, so your data will sync automatically."}
          </p>
        )}
      </div>
    </Dialog>
  );
}
