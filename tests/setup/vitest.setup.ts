import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

process.env.NODE_ENV = "test";

afterEach(() => {
  cleanup();
});
