import { ReactNode } from "react";

import {
  Select as GenericSelect,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";

const Select = ({
  open,
  onOpen,
  onClose,
  trigger = null,
  triggerAsChild,
  triggerClassName,
  triggerStyle,
  children = null,
  value,
  onChange,
}: {
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  trigger?: ReactNode;
  triggerAsChild?: boolean;
  triggerClassName?: string;
  children: ReactNode | ReactNode[];
  value?: any;
  onChange: (e: any) => void;
  triggerStyle?: object;
}) => {
  const onOpenChange = (open) => {
    if (open) onOpen?.();
    else onClose?.();
  };

  return (
    <GenericSelect
      open={open}
      onOpenChange={onOpenChange}
      value={value}
      onValueChange={onChange}
    >
      {(trigger || triggerAsChild) && (
        <SelectTrigger
          style={triggerStyle}
          className={triggerClassName}
          asChild={triggerAsChild}
        >
          {trigger}
        </SelectTrigger>
      )}
      <SelectContent
        ref={(r) => {
          if (!r) return;
          r.ontouchend = r.ontouchstart = (e) => {
            e.preventDefault();
            e.stopPropagation();
          };
        }}
      >
        {children}
      </SelectContent>
    </GenericSelect>
  );
};

export default Select;
