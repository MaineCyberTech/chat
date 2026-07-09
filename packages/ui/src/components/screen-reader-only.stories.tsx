import type { Meta, StoryObj } from "@storybook/react";
import { ScreenReaderOnly } from "./screen-reader-only";

const meta: Meta<typeof ScreenReaderOnly> = {
  title: "UI/ScreenReaderOnly",
  component: ScreenReaderOnly,
};

export default meta;
type Story = StoryObj<typeof ScreenReaderOnly>;

export const Default: Story = {
  args: {
    children: "This text is only visible to screen readers",
  },
};
