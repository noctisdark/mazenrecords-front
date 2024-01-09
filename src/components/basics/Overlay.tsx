import { cn } from "@/lib/utils";

const Overlay = ({ className = "", children }) => (
  <div className={cn("fixed inset-0 flex justify-center items-center", className)}>
    {children}
  </div>
);

export default Overlay;
