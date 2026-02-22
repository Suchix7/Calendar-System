import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // This is the new method!

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
