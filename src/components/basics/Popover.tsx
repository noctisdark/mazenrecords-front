import { ReactNode } from "react";

import {
  Popover as GenericPopover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Popover = ({
  open,
  onOpen,
  onClose,
  trigger = null,
  triggerAsChild,
  children = null,
}: {
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  trigger?: ReactNode;
  triggerAsChild?: boolean;
  children: ReactNode | ReactNode[];
}) => {
  const onOpenChange = (open) => {
    if (open) onOpen?.();
    else onClose?.();
  };

  return (
    <GenericPopover open={open} onOpenChange={onOpenChange}>
      {trigger && <PopoverTrigger asChild={triggerAsChild}>{trigger}</PopoverTrigger>}
      <PopoverContent>{children}</PopoverContent>
    </GenericPopover>
  );
};

export default Popover;
