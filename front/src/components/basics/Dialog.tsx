import { ReactNode } from "react";

import {
  DialogContent,
  DialogTrigger,
  Dialog as GenericDialog,
} from "@/components/ui/dialog";

const Dialog = ({
  open,
  onOpen,
  onClose,
  trigger = null,
  triggerAsChild,
  children = null,
  confirmBeforeClose = true,
  confirmMessage = "Do you really want to discard your input ?",
}: {
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  trigger?: ReactNode;
  triggerAsChild?: boolean;
  children: ReactNode | ReactNode[];
  confirmBeforeClose?: boolean;
  confirmMessage?: string;
}) => {
  const onOpenChange = (open) => {
    if (open) onOpen?.();
    else {
      if (!confirmBeforeClose || confirm(confirmMessage)) onClose?.();
    }
  };

  return (
    <GenericDialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger asChild={triggerAsChild}>{trigger}</DialogTrigger>
      )}
      <DialogContent>{children}</DialogContent>
    </GenericDialog>
  );
};

export default Dialog;
