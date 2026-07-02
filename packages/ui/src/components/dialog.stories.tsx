import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Dialog } from "./dialog";
import { Button } from "./button";

const meta: Meta<typeof Dialog> = {
  title: "Components/Dialog",
  component: Dialog,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Dialog>;

function DialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Example Dialog">
        <p className="text-[var(--color-foreground-secondary)]">This is the dialog content.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Confirm</Button>
        </div>
      </Dialog>
    </div>
  );
}

export const Basic: Story = {
  render: () => <DialogExample />,
};
