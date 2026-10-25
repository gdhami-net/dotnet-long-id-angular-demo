// TypeScript 6 types the reviver with two arguments only. This adds the
// third one, the same shape TypeScript 7.1 ships in its es2026 lib.
interface JSON {
  parse(
    text: string,
    reviver: (this: any, key: string, value: any, context: { source?: string }) => any,
  ): any;
}
