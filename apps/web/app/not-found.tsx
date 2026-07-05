import Link from "next/link";
import { Button } from "@chat/ui";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center"
      style={{ backgroundColor: "var(--center-channel-bg)" }}
    >
      <h1 className="text-2xl font-bold" style={{ color: "var(--center-channel-color)" }}>
        Page not found
      </h1>
      <p
        className="max-w-md text-sm"
        style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
      >
        The page you are looking for does not exist.
      </p>
      <Link href="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}
