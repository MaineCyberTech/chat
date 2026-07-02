import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, SkeletonLine, SkeletonCircle } from "./skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "Components/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Basic: Story = {
  args: {
    className: "h-4 w-48",
  },
};

export const Line: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <SkeletonLine width="100%" />
      <SkeletonLine width="75%" />
      <SkeletonLine width="50%" />
    </div>
  ),
};

export const Circle: Story = {
  render: () => (
    <div className="flex gap-2">
      <SkeletonCircle size={36} />
      <SkeletonCircle size={48} />
      <SkeletonCircle size={64} />
    </div>
  ),
};

export const CardSkeleton: Story = {
  render: () => (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border-primary)] p-4">
      <div className="flex items-center gap-3">
        <SkeletonCircle size={40} />
        <div className="flex flex-col gap-2">
          <SkeletonLine width="120px" />
          <SkeletonLine width="80px" />
        </div>
      </div>
      <SkeletonLine width="100%" />
      <SkeletonLine width="60%" />
    </div>
  ),
};
