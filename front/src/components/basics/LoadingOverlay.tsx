import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import Overlay from "./Overlay";

const LoadingOverlay = ({ className = "" }) => (
  <Overlay>
    <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
  </Overlay>
);

export default LoadingOverlay;
