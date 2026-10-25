// For an API you can't change: read the ID fields from the original JSON text,
// so a number above 2^53 keeps its digits (as a string).
export function parseWithExactIds(text: string, keys: readonly string[] = ['id']) {
  return JSON.parse(text, (key, value, context) =>
    keys.includes(key) && typeof value === 'number' ? context.source : value);
}
