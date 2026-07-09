import Link from "next/link";
import { Button } from "@chat/ui";

export default function WorkspaceNotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center"
      style={{ backgroundColor: "var(--center-channel-bg)" }}
    >
      <h1 className="text-2xl font-bold" style={{ color: "var(--center-channel-color)" }}>
        Workspace not found
      </h1>
      <p
        className="max-w-md text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        This workspace does not exist or you may not have access to it.
      </p>
      <Link href="/">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
