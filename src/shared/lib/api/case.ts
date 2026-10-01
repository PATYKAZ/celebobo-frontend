/** Conversion récursive des clés snake_case <-> camelCase (Django <-> front). */

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" &&
  v !== null &&
  !Array.isArray(v) &&
  !(v instanceof Date) &&
  !(typeof FormData !== "undefined" && v instanceof FormData) &&
  !(typeof Blob !== "undefined" && v instanceof Blob) &&
  !(typeof File !== "undefined" && v instanceof File);

const toCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

function convert(value: unknown, fn: (k: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => convert(v, fn));
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [fn(k), convert(v, fn)]));
  }
  return value;
}

export const camelizeKeys = <T = unknown>(value: unknown): T => convert(value, toCamel) as T;
export const snakeizeKeys = <T = unknown>(value: unknown): T => convert(value, toSnake) as T;
