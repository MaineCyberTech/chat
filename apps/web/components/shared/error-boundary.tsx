"use client";

import React, { Component, type ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@chat/ui";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[var(--color-background-primary)] p-8 text-center">
          <h2 className="text-xl font-semibold text-[var(--color-foreground-primary)]">
            Something went wrong
          </h2>
          <p className="max-w-md text-sm text-[var(--color-foreground-secondary)]">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
