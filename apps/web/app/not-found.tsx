import Link from "next/link";
import { Button } from "@chat/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-background-primary)] p-8 text-center">
      <h1 className="text-2xl font-bold text-[var(--color-foreground-primary)]">Page not found</h1>
      <p className="max-w-md text-sm text-[var(--color-foreground-secondary)]">
        The page you are looking for does not exist.
      </p>
      <Link href="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}
