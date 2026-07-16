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
    // Error captured by Sentry integration
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex h-screen flex-col items-center justify-center gap-4 p-8 text-center"
          style={{ backgroundColor: "var(--center-channel-bg)" }}
        >
          <h2 className="text-xl font-semibold" style={{ color: "var(--center-channel-color)" }}>
            Something went wrong
          </h2>
          <p className="max-w-md text-sm" style={{ color: "var(--text-secondary)" }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
