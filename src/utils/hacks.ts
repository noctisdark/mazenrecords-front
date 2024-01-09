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
