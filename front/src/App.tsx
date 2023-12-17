import "index.css";
import { useEffect } from "react";

import Main from "@/components/app/Main";
import { Toaster } from "@/components/ui/toaster";
import BrandsProvider from "@/providers/BrandsProvider";
import IndexedDBProvider from "@/providers/IndexedDBProvider";
import IntlProvider from "@/providers/IntlProvider";
import ThemeProvider from "@/providers/ThemeProvider";
import TooltipProvider from "@/providers/TooltipProvider";
import VisitsProvider from "@/providers/VisitsProvider";

import { useSafeAreaInsets } from "./utils/screen";
import AuthProvider from "./providers/AuthProvider";

const App = () => {
  const safeAreaInsets = useSafeAreaInsets();

  useEffect(() => {
    if (!safeAreaInsets) return;
    for (const [key, value] of Object.entries(safeAreaInsets)) {
      document.documentElement.style.setProperty(
        `--safe-area-inset-${key}`,
        `${value}px`,
      );
    }
  }, [safeAreaInsets]);

  return (
    <ThemeProvider>
      <IntlProvider>
        <TooltipProvider>
          <AuthProvider>
            <IndexedDBProvider>
              <VisitsProvider>
                <BrandsProvider>
                  <Main />
                </BrandsProvider>
              </VisitsProvider>
            </IndexedDBProvider>
          </AuthProvider>
        </TooltipProvider>
      </IntlProvider>
      <Toaster />
    </ThemeProvider>
  );
};

export default App;
