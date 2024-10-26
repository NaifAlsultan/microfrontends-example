import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: [
        path.join(process.cwd(), "index.html"),
        path.join(process.cwd(), "src", "main.tsx"),
      ],
      preserveEntrySignatures: "allow-extension",
    },
  },
  server: {
    port: 5174,
  },
});
