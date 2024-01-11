import { SafeArea } from "capacitor-plugin-safe-area";
import { useEffect, useState } from "react";
import { useAsyncEffect } from "./hacks";

export type SafeAreaInsets = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export const useSafeAreaInsets = () => {
  const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>();

  useAsyncEffect(async () => {
    const { insets } = await SafeArea.getSafeAreaInsets();
    setSafeAreaInsets(insets);
    let eventListener = await SafeArea.addListener("safeAreaChanged", (data) => {
      const { insets } = data;
      setSafeAreaInsets(insets);
    });
    return () => {
      eventListener.remove();
    };
  }, []);

  return safeAreaInsets;
};

export const useOrientation = () => {
  const [orientation, setOrientation] = useState(screen.orientation.type);

  useEffect(() => {
    const onOrientationChange = () => {
      setOrientation(screen.orientation.type);
    };

    screen.orientation.addEventListener("change", onOrientationChange);
    return () => {
      window.removeEventListener("orientationchange", onOrientationChange);
    };
  }, []);

  return orientation;
};
