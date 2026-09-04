import { resolve } from "node:path";
import { createServer, type Plugin } from "vite-plus";
import { octane } from "octane/compiler/vite";
import type { RenderResult } from "octane/server";

const packageRoot = resolve(import.meta.dirname, "..");

export async function renderHydrationFixture(
  fixture: string,
  exportName: string,
  props?: unknown,
): Promise<RenderResult> {
  const server = await createServer({
    appType: "custom",
    configFile: false,
    logLevel: "silent",
    plugins: [octane({ ssr: true }) as unknown as Plugin],
    root: packageRoot,
    server: { hmr: false, middlewareMode: true },
  });

  try {
    const [fixtureModule, runtime] = await Promise.all([
      server.ssrLoadModule(resolve(packageRoot, fixture)),
      server.ssrLoadModule("octane/server"),
    ]);
    const component = fixtureModule[exportName];

    if (typeof component !== "function") {
      throw new Error(
        `Missing server fixture export: ${fixture}#${exportName}`,
      );
    }

    return runtime.renderToString(component, props) as RenderResult;
  } finally {
    await server.close();
  }
}
