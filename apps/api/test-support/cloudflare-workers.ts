export const env: Record<string, unknown> = new Proxy(
  {},
  { get: (_target, key: string): unknown => process.env[key] }
);
