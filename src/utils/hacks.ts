import { DependencyList, EffectCallback, useEffect } from "react";

export const useEffectOnce = import.meta.env.DEV
  ? (effect: EffectCallback, deps: DependencyList) => {
      let ran = false;
      useEffect(() => {
        if (ran) return;

        //eslint-disable-next-line react-hooks/exhaustive-deps
        ran = true;
        effect();

        // no clean up
      }, deps);
    }
  : useEffect;

export const useAsyncEffect = (
  callback: () => Promise<() => void> | Promise<void>,
  deps: DependencyList,
) => {
  useEffect(() => {
    let cleanedUp = false;
    let cleanUpFunction: void | (() => void);

    (async () => {
      cleanUpFunction = await callback();
      if (cleanedUp) cleanUpFunction?.();
    })();

    return () => {
      cleanedUp = true;
      cleanUpFunction?.();
    };
  }, deps);
};
