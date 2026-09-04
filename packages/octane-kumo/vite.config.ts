import { defineConfig } from "vite-plus";
import { octane } from "octane/compiler/vite";

export default defineConfig({
  plugins: [octane({ requireDirective: true })],
  test: {
    environment: "happy-dom",
    globals: false,
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
  },
});
