import "index.css";
import React from "react";

import { Toaster } from "@/components/ui/toaster";
import IndexedDBProvider from "@/providers/IndexedDBProvider";
import IntlProvider from "@/providers/IntlProvider";
import ThemeProvider from "@/providers/ThemeProvider";
import TooltipProvider from "@/providers/TooltipProvider";

import Main from "./components/app/Routes/Main";
import BrandsProvider from "./providers/BrandsProvider";
import VisitsProvider from "./providers/VisitsProvider";

const App = () => {
  return (
    <React.StrictMode>
      <IntlProvider>
        <ThemeProvider>
          <TooltipProvider>
            <IndexedDBProvider>
              <VisitsProvider>
                <BrandsProvider>
                  <Main />
                  <Toaster />
                </BrandsProvider>
              </VisitsProvider>
            </IndexedDBProvider>
          </TooltipProvider>
        </ThemeProvider>
      </IntlProvider>
    </React.StrictMode>
  );
};

export default App;
