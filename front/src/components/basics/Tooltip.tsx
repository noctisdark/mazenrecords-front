import { ReactNode } from "react";

import {
  Tooltip as GenericTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Tooltip = ({
  trigger,
  triggerAsChild,
  children,
}: {
  trigger?: ReactNode;
  triggerAsChild?: boolean;
  children: ReactNode | ReactNode[];
}) => (
  <GenericTooltip>
    {trigger && (
      <TooltipTrigger asChild={triggerAsChild}>{trigger}</TooltipTrigger>
    )}
    <TooltipContent>{children}</TooltipContent>
  </GenericTooltip>
);

export default Tooltip;
