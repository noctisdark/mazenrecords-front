import { Network } from "@capacitor/network";
import { useState } from "react";

import { useAsyncEffect } from "./hacks";

export const useNetworkStatus = (): "online" | "offline" | undefined => {
  const [status, setStatus] = useState<"online" | "offline">();

  useAsyncEffect(async () => {
    const { connected } = await Network.getStatus();
    setStatus(connected ? "online" : "offline");

    let callback = await Network.addListener("networkStatusChange", ({ connected }) => {
      setStatus(connected ? "online" : "offline");
    });

    return () => {
      callback.remove();
    };
  }, []);

  return status;
};
