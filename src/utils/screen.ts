import { SafeArea } from "capacitor-plugin-safe-area";
import { useEffect, useState } from "react";

export type SafeAreaInsets = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export const useSafeAreaInsets = () => {
  const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>();

  useEffect(() => {
    let eventListener;
    const onSafeAreaChanged = async (data) => {
      const { insets } = data;
      setSafeAreaInsets(insets);
    };

    (async () => {
      const { insets } = await SafeArea.getSafeAreaInsets();
      setSafeAreaInsets(insets);
      eventListener = await SafeArea.addListener(
        "safeAreaChanged",
        onSafeAreaChanged,
      );
    })();

    return () => {
      eventListener?.remove();
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
