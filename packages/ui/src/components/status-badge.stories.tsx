import type { Meta, StoryObj } from "@storybook/react";
import { StatusBadge } from "./status-badge";

const meta: Meta<typeof StatusBadge> = {
  title: "UI/StatusBadge",
  component: StatusBadge,
  argTypes: {
    status: {
      control: "select",
      options: ["online", "away", "dnd", "offline"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Online: Story = { args: { status: "online" } };
export const Away: Story = { args: { status: "away" } };
export const Dnd: Story = { args: { status: "dnd" } };
export const Offline: Story = { args: { status: "offline" } };
