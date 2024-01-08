import { useEffect, useState } from "react";

export const useNetworkStatus = (): [
  "online" | "offline",
  (setOffline: boolean) => void,
  boolean,
] => {
  const [status, setStatus] = useState<"online" | "offline">(
    navigator.onLine ? "online" : "offline",
  );

  const [forcedOffline, setForcedOffline] = useState(false);

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

  return [forcedOffline ? "offline" : status, setForcedOffline, forcedOffline];
};
