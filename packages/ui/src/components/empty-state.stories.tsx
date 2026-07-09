import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./empty-state";
import { Button } from "./button";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Basic: Story = {
  args: {
    description: "No items found",
  },
};

export const WithTitle: Story = {
  args: {
    title: "No results",
    description: "Try adjusting your search",
  },
};

export const WithAction: Story = {
  args: {
    description: "No messages yet. Start the conversation!",
    action: <Button variant="primary">Create Message</Button>,
  },
};
