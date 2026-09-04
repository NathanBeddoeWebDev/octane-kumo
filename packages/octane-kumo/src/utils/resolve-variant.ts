export function resolveVariant<T extends Record<string, unknown>>(
  variants: T,
  key: string,
  fallback: keyof T & string,
): T[keyof T] {
  const config = variants[key] as T[keyof T] | undefined;

  if (config !== undefined) return config;

  const processEnv = (
    globalThis as typeof globalThis & {
      process?: { env?: { NODE_ENV?: string } };
    }
  ).process?.env;
  if (processEnv?.NODE_ENV !== "production") {
    console.warn(
      `[kumo] Unknown variant "${key}". Expected one of: ${Object.keys(variants).join(", ")}. Falling back to "${fallback}".`,
    );
  }

  return variants[fallback];
}
