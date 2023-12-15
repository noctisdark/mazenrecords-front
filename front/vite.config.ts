import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(), [react({ tsDecorators: true })]],
  server: {
    port: +process.env.PORT || 3000,
    host: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      tsconfig: "./tsconfig.json",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
