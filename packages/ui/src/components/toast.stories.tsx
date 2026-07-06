import type { Meta, StoryObj } from "@storybook/react";
import { ToastProvider, ToastContainer, type Toast, type ToastVariant } from "./toast";

const meta: Meta<typeof ToastContainer> = {
  title: "Components/Toast",
  component: ToastContainer,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ToastContainer>;

const toastVariants: ToastVariant[] = ["default", "success", "error", "warning", "info"];

export const Basic: Story = {
  render: () => (
    <div className="min-h-[200px]">
      <ToastProvider>
        <div />
      </ToastProvider>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => {
    const toasts: Toast[] = toastVariants.map((variant) => ({
      id: `toast-${variant}`,
      title: `${variant.charAt(0).toUpperCase() + variant.slice(1)} toast`,
      description: "This is a description for the toast.",
      variant,
    }));
    return <ToastContainer toasts={toasts} onRemove={() => {}} />;
  },
};

export const WithDescription: Story = {
  render: () => (
    <ToastContainer
      toasts={[
        {
          id: "desc-toast",
          title: "File uploaded",
          description: "Screenshot-2024.png was uploaded successfully.",
          variant: "success",
        },
      ]}
      onRemove={() => {}}
    />
  ),
};

export const ErrorToast: Story = {
  render: () => (
    <ToastContainer
      toasts={[
        {
          id: "error-toast",
          title: "Failed to send",
          description: "Check your connection and try again.",
          variant: "error",
        },
      ]}
      onRemove={() => {}}
    />
  ),
};
