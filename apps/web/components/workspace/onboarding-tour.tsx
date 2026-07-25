"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { X, Check, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

interface Task {
  id: string;
  label: string;
  description: string;
  actionLabel: string;
  actionHref?: string;
  checkKey: string;
}

const TASKS: Task[] = [
  {
    id: "join-channel",
    label: "Join a channel",
    description: "Browse channels from the sidebar and join a conversation.",
    actionLabel: "Browse channels",
    checkKey: "onboarding:joined_channel",
  },
  {
    id: "send-message",
    label: "Send your first message",
    description: "Type a message in any channel to start collaborating.",
    actionLabel: "Start typing",
    checkKey: "onboarding:sent_message",
  },
  {
    id: "invite-members",
    label: "Invite team members",
    description: "Bring your team on board by sending them an invite link.",
    actionLabel: "Invite people",
    actionHref: "?invite=true",
    checkKey: "onboarding:invited_members",
  },
  {
    id: "customize-profile",
    label: "Set up your profile",
    description: "Add a display name and avatar so people know who you are.",
    actionLabel: "Edit profile",
    checkKey: "onboarding:set_profile",
  },
  {
    id: "explore-settings",
    label: "Configure notifications",
    description: "Set your notification preferences to stay in the loop.",
    actionLabel: "Open settings",
    actionHref: "?settings=true",
    checkKey: "onboarding:configured_notifications",
  },
];

function getCompleted(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    console.warn("Failed to read onboarding state");
    return false;
  }
}

function getOnboardingDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem("onboarding:dismissed") === "true";
  } catch {
    console.warn("Failed to read onboarding dismissed state");
    return true;
  }
}

function setOnboardingDismissed() {
  try {
    localStorage.setItem("onboarding:dismissed", "true");
  } catch {
    console.warn("Failed to save onboarding dismissed state");
    /* ignore */
  }
}

function getOnboardingCompleted(): boolean {
  try {
    return TASKS.every((t) => getCompleted(t.checkKey));
  } catch {
    console.warn("Failed to check onboarding completion");
    return false;
  }
}

export function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [taskStates, setTaskStates] = useState<Record<string, boolean>>({});
  const [completedCount, setCompletedCount] = useState(0);
  const onboardingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (getOnboardingCompleted()) return;
    if (getOnboardingDismissed()) return;
    const states: Record<string, boolean> = {};
    let count = 0;
    for (const t of TASKS) {
      const done = getCompleted(t.checkKey);
      states[t.id] = done;
      if (done) count++;
    }
    setTaskStates(states);
    setCompletedCount(count);
    setVisible(true);
    // Sync completed tasks to server
    const completedKeys = TASKS.filter((t) => states[t.id]).map((t) => t.checkKey);
    if (completedKeys.length > 0) {
      api.put("/preferences", { onboarding: completedKeys }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const prevFocus = document.activeElement as HTMLElement;
    const el = onboardingRef.current;
    if (el) {
      const focusable = el.querySelectorAll<HTMLElement>("button, [tabindex]:not([tabindex='-1'])");
      if (focusable.length > 0) focusable[0]?.focus();
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          dismiss();
          return;
        }
        if (e.key !== "Tab") return;
        e.preventDefault();
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) last?.focus();
        else if (!e.shiftKey && document.activeElement === last) first?.focus();
      };
      el.addEventListener("keydown", handler);
      return () => {
        el.removeEventListener("keydown", handler);
        prevFocus?.focus();
      };
    }
  }, [visible]);

  const dismiss = useCallback(() => {
    setOnboardingDismissed();
    setVisible(false);
  }, []);

  const totalTasks = TASKS.length;
  const allDone = completedCount >= totalTasks;

  if (!visible) return null;

  return (
    <div
      ref={onboardingRef}
      role="dialog"
      aria-modal="true"
      aria-label="Getting started"
      className="fixed right-6 bottom-6 z-50 w-80 rounded-lg border shadow-[var(--elevation-5)]"
      style={{
        background: "var(--center-channel-bg)",
        borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
      }}
    >
      <div
        className="flex items-center justify-between rounded-t-lg px-4 py-3"
        style={{
          background: "var(--sidebar-bg)",
          color: "var(--sidebar-text)",
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} />
          <span className="text-sm font-semibold">Getting started</span>
        </div>
        <button
          onClick={dismiss}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-[rgba(255,255,255,0.15)]"
          aria-label="Dismiss onboarding"
        >
          <X size={14} />
        </button>
      </div>

      <div className="px-4 py-3">
        <div className="mb-3 flex items-center gap-2">
          <div
            className="h-2 flex-1 rounded-full"
            style={{
              background: "rgba(var(--center-channel-color-rgb), 0.08)",
            }}
          >
            <div
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemax={totalTasks}
              className="h-full rounded-full transition-all"
              style={{
                width: `${(completedCount / totalTasks) * 100}%`,
                background: "var(--button-bg)",
              }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {completedCount}/{totalTasks}
          </span>
        </div>

        {allDone ? (
          <div className="py-4 text-center">
            <Check
              size={24}
              className="mx-auto mb-2"
              style={{ color: "var(--online-indicator)" }}
            />
            <p className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>
              All set!
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              You&apos;ve completed all onboarding tasks.
            </p>
            <button
              onClick={dismiss}
              className="mt-3 rounded-md px-4 py-1.5 text-xs font-medium text-white"
              style={{ background: "var(--button-bg)" }}
            >
              Got it
            </button>
          </div>
        ) : (
          <ul className="space-y-1">
            {TASKS.map((task) => {
              const done = taskStates[task.id] ?? false;
              return (
                <li
                  key={task.id}
                  className={`flex items-start gap-2 rounded-md p-2 ${done ? "opacity-50" : ""}`}
                >
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: done
                        ? "var(--online-indicator)"
                        : "rgba(var(--center-channel-color-rgb), 0.16)",
                      color: "var(--button-color)",
                    }}
                  >
                    {done && <Check size={10} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs font-medium"
                      style={{ color: "var(--center-channel-color)" }}
                    >
                      {task.label}
                    </p>
                    <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                      {task.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
