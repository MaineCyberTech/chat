import { useRef } from "react";
import { DeleteDialog } from "./delete-dialog";

export default {
  title: "Chat/DeleteDialog",
  component: DeleteDialog,
};

export const Basic = {
  render: () => {
    const ref = useRef<HTMLDivElement>(null);
    return (
      <DeleteDialog
        deleteConfirmId="msg-1"
        deleteError=""
        onClose={() => {}}
        onConfirm={async () => {}}
        dialogRef={ref}
      />
    );
  },
};

export const WithError = {
  render: () => {
    const ref = useRef<HTMLDivElement>(null);
    return (
      <DeleteDialog
        deleteConfirmId="msg-1"
        deleteError="Failed to delete message. Please try again."
        onClose={() => {}}
        onConfirm={async () => {}}
        dialogRef={ref}
      />
    );
  },
};
