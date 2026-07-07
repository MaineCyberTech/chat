// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton, SkeletonLine, SkeletonCircle } from "../skeleton";

describe("Skeleton", () => {
  it("renders with default props", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeDefined();
    expect(el.className).toContain("animate-pulse");
    expect(el.className).toContain("rounded-md");
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  it("applies custom className", () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("custom-class");
  });

  it("applies custom style", () => {
    const { container } = render(<Skeleton style={{ width: 100, height: 20 }} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe("100px");
    expect(el.style.height).toBe("20px");
  });
});

describe("SkeletonLine", () => {
  it("renders with default width", () => {
    const { container } = render(<SkeletonLine />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("h-4");
    expect(el.style.width).toBe("100%");
  });

  it("renders with custom width", () => {
    const { container } = render(<SkeletonLine width="50%" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe("50%");
  });
});

describe("SkeletonCircle", () => {
  it("renders with default size", () => {
    const { container } = render(<SkeletonCircle />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("rounded-full");
    expect(el.style.width).toBe("36px");
    expect(el.style.height).toBe("36px");
  });

  it("renders with custom size", () => {
    const { container } = render(<SkeletonCircle size={48} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe("48px");
    expect(el.style.height).toBe("48px");
  });
});
