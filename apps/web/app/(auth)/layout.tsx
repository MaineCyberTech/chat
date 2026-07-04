import { ErrorBoundary } from "@/components/shared/error-boundary";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
