import { Capacitor } from "@capacitor/core";
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.tsx";

const platform = Capacitor.getPlatform();

if (platform === "web") {
  const openURL = new URL(window.location.href);
  if (openURL.pathname === "/callback") {
    const code = openURL.searchParams.get("code");
    window.opener.postMessage({ source: "/callback", code }, window.location.origin);
    window.close();
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
