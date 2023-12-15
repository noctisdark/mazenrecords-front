import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "dev.mazensapp.app",
  appName: "mazensapp",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    Keyboard: {
      resizeOnFullScreen: true,
    },
  },
};

export default config;
