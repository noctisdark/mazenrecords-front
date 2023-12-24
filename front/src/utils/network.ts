import { useEffect, useState } from "react";

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<"online" | "offline">(
    navigator.onLine ? "online" : "offline",
  );

  const [forceOffline, setForceOffline] = useState(false);

  useEffect(() => {
    const onOnline = () => setStatus("online");
    const onOffline = () => setStatus("offline");

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return [forceOffline ? "offline" : status, setForceOffline];
};
