// The reviver with its third argument. TypeScript 6 rejects this unless
// client/src/json-source.d.ts is part of the compilation.
const text = '{"id":1234567890123456789}';
export const parsed = JSON.parse(text, (key, value, context) =>
  key === 'id' ? context.source : value);
