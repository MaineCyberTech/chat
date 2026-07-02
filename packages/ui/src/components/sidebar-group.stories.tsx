import type { Meta, StoryObj } from "@storybook/react";
import { SidebarGroup } from "./sidebar-group";

const meta: Meta<typeof SidebarGroup> = {
  title: "Components/SidebarGroup",
  component: SidebarGroup,
  tags: ["autodocs"],
  argTypes: {
    defaultOpen: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof SidebarGroup>;

export const Open: Story = {
  args: {
    title: "Channels",
    defaultOpen: true,
    children: (
      <div className="flex flex-col gap-1 px-3">
        <span className="cursor-pointer text-sm text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground-primary)]">
          # general
        </span>
        <span className="cursor-pointer text-sm text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground-primary)]">
          # random
        </span>
        <span className="cursor-pointer text-sm text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground-primary)]">
          # engineering
        </span>
      </div>
    ),
  },
};

export const Closed: Story = {
  args: {
    title: "Channels",
    defaultOpen: false,
    children: (
      <div className="flex flex-col gap-1 px-3">
        <span className="text-sm text-[var(--color-foreground-secondary)]"># general</span>
      </div>
    ),
  },
};
