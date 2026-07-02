import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./avatar";

const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  args: {
    src: "https://i.pravatar.cc/150?u=test",
    alt: "User avatar",
  },
};

export const WithFallback: Story = {
  args: {
    fallback: "JD",
    alt: "John Doe",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    fallback: "AB",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    fallback: "CD",
  },
};

export const Empty: Story = {
  args: {},
};
