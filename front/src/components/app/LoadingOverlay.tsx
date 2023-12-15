import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const LoadingOverlay = ({ className = "" }) => (
  <div className="fixed inset-0 flex justify-center items-center">
    <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
  </div>
);

export default LoadingOverlay;
