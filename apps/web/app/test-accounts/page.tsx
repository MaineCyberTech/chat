"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";

const ACCOUNTS = [
  {
    email: "marcus@seed.test",
    name: "Marcus Chen",
    role: "Product Manager",
    workspaces: ["Acme Corp"],
    color: "#3b82f6",
  },
  {
    email: "sarah@seed.test",
    name: "Sarah Patel",
    role: "UX Researcher",
    workspaces: ["Acme Corp", "DesignHub"],
    color: "#8b5cf6",
  },
  {
    email: "jake@seed.test",
    name: "Jake Morrison",
    role: "DevOps Engineer",
    workspaces: ["Acme Corp"],
    color: "#ef4444",
  },
  {
    email: "elena@seed.test",
    name: "Elena Volkov",
    role: "Backend Engineer",
    workspaces: ["Acme Corp"],
    color: "#10b981",
  },
  {
    email: "tyler@seed.test",
    name: "Tyler Brooks",
    role: "Frontend Engineer",
    workspaces: ["Acme Corp", "DesignHub"],
    color: "#f59e0b",
  },
  {
    email: "priya@seed.test",
    name: "Priya Sharma",
    role: "QA Engineer",
    workspaces: ["Acme Corp"],
    color: "#ec4899",
  },
  {
    email: "carlos@seed.test",
    name: "Carlos Rivera",
    role: "SRE",
    workspaces: ["TechStart"],
    color: "#06b6d4",
  },
  {
    email: "aisha@seed.test",
    name: "Aisha Johnson",
    role: "Design Lead",
    workspaces: ["Acme Corp", "DesignHub"],
    color: "#d946ef",
  },
  {
    email: "liam@seed.test",
    name: "Liam O'Brien",
    role: "CI/CD Engineer",
    workspaces: ["Acme Corp"],
    color: "#14b8a6",
  },
  {
    email: "mei@seed.test",
    name: "Mei Lin",
    role: "Data Engineer",
    workspaces: ["Acme Corp"],
    color: "#f97316",
  },
  {
    email: "dmitri@seed.test",
    name: "Dmitri Petrov",
    role: "Security Engineer",
    workspaces: ["Acme Corp"],
    color: "#64748b",
  },
  {
    email: "nkechi@seed.test",
    name: "Nkechi Adeyemi",
    role: "Business Development",
    workspaces: ["TechStart", "Acme Corp"],
    color: "#84cc16",
  },
  {
    email: "raj@seed.test",
    name: "Raj Gupta",
    role: "Engineering Manager",
    workspaces: ["TechStart"],
    color: "#e11d48",
  },
  {
    email: "fatima@seed.test",
    name: "Fatima Al-Rashid",
    role: "Product Designer",
    workspaces: ["DesignHub"],
    color: "#7c3aed",
  },
  {
    email: "tom@seed.test",
    name: "Tom Nguyen",
    role: "Marketing Intern",
    workspaces: ["TechStart"],
    color: "#2563eb",
  },
  {
    email: "admin@seed.test",
    name: "Alex Admin",
    role: "Super Admin",
    workspaces: ["Acme Corp", "TechStart", "DesignHub"],
    color: "#dc2626",
  },
  {
    email: "olivia@seed.test",
    name: "Olivia Foster",
    role: "Staff Engineer",
    workspaces: ["Acme Corp"],
    color: "#0891b2",
  },
  {
    email: "jamal@seed.test",
    name: "Jamal Williams",
    role: "SWE Intern",
    workspaces: ["TechStart"],
    color: "#65a30d",
  },
  {
    email: "chen@seed.test",
    name: "Chen Wei",
    role: "Product Manager",
    workspaces: ["DesignHub"],
    color: "#c026d3",
  },
  {
    email: "sofia@seed.test",
    name: "Sofia Rodriguez",
    role: "Product Designer",
    workspaces: ["Acme Corp"],
    color: "#ea580c",
  },
  {
    email: "ethan@seed.test",
    name: "Ethan Kowalski",
    role: "Sales Engineer",
    workspaces: ["TechStart"],
    color: "#0d9488",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function TestAccountsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (process.env.NODE_ENV === "production") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--center-channel-bg)]">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[var(--center-channel-color)]">
            Not Available
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            This page is only available in development.
          </p>
        </div>
      </main>
    );
  }

  async function handleLogin(email: string) {
    setLoading(email);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: "password123",
      });

      if (authError) {
        setError(authError.message);
        setLoading(null);
        return;
      }

      const { data: workspaces } = await supabase
        .from("workspace_members" as never)
        .select("workspace:workspaces!inner(slug)" as never)
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "")
        .limit(1);

      const slug =
        workspaces && workspaces.length > 0
          ? (workspaces[0] as unknown as { workspace: { slug: string } }).workspace.slug
          : "acme-corp";

      router.push(`/${slug}`);
    } catch {
      setError("Login failed. Is the dev server running?");
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen overflow-y-auto bg-[var(--center-channel-bg)]">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--center-channel-color)]">
            Test Accounts
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Click any account to sign in automatically. Password:{" "}
            <code
              className="rounded px-1.5 py-0.5 font-mono text-xs"
              style={{
                backgroundColor: "rgba(var(--center-channel-color-rgb), 0.08)",
                color: "var(--center-channel-color)",
              }}
            >
              password123
            </code>
          </p>
        </div>

        {error && (
          <div
            className="mx-auto mb-6 max-w-md rounded-lg border px-4 py-3 text-sm"
            style={{
              borderColor: "rgba(239,68,68,0.3)",
              backgroundColor: "rgba(239,68,68,0.08)",
              color: "#ef4444",
            }}
          >
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACCOUNTS.map((account) => (
            <button
              key={account.email}
              onClick={() => handleLogin(account.email)}
              disabled={loading !== null}
              className="group flex items-center gap-3 rounded-lg border p-4 text-left transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.12)",
                backgroundColor: "var(--center-channel-bg)",
              }}
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: account.color }}
              >
                {loading === account.email ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  getInitials(account.name)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[var(--center-channel-color)]">
                  {account.name}
                </div>
                <div className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {account.role}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {account.workspaces.map((ws) => (
                    <span
                      key={ws}
                      className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: "rgba(var(--center-channel-color-rgb), 0.06)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {ws}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="text-sm underline hover:text-[var(--center-channel-color)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
