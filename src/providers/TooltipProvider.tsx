import { TooltipProvider as GenericTooltipProvider } from "@/components/ui/tooltip";

const TooltipProvider = ({ children }) => {
  return <GenericTooltipProvider>{children}</GenericTooltipProvider>;
};

export default TooltipProvider;
