import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import octane from "@octanejs/astro";
import { fileURLToPath } from "node:url";
import { fixturePath, generateExamples } from "./scripts/examples.mjs";

await generateExamples();

export default defineConfig({
  devToolbar: { enabled: false },
  integrations: [
    octane({ exclude: ["**/examples/react/**", "**/packages/kumo/**"] }),
    react({ include: ["**/examples/react/**", "**/packages/kumo/**"] }),
  ],
  vite: {
    resolve: {
      // pnpm may install the same runtime with different optional peer sets.
      dedupe: ["octane", "react", "react-dom"],
      alias: [
        {
          find: /^@cloudflare\/kumo$/,
          replacement: fileURLToPath(
            new URL("../kumo/src/index.ts", import.meta.url),
          ),
        },
        {
          find: /^@cloudflare\/kumo\/code$/,
          replacement: fileURLToPath(
            new URL("../kumo/src/code/index.ts", import.meta.url),
          ),
        },
      ],
    },
    plugins: [
      {
        name: "comparison-examples",
        configureServer(server) {
          server.watcher.add(fixturePath);
        },
        async handleHotUpdate(context) {
          if (context.file === fixturePath) await generateExamples();
        },
      },
    ],
  },
});
