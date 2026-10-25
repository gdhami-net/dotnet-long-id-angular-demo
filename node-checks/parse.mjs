// Where the digits change: JSON.parse itself, no Angular involved.
// Run with: node node-checks/parse.mjs   (Node 26; imports the page's .ts helper
// directly, which works because Node strips the type annotations)
import assert from 'node:assert/strict';
import { parseWithExactIds } from '../client/src/app/parse-ids.ts';

const text = '[{"id":1234567890123456789,"customer":"Snowflake Ltd","total":19.99},{"id":42,"customer":"Identity Co","total":5.50}]';
const show = (label, value) => console.log(label.padEnd(34), value);

// 1. The plain parse: a double, and no error.
const plain = JSON.parse(text);
show('JSON.parse id:', plain[0].id);
show('the double it really holds:', BigInt(plain[0].id).toString());
show('Number.MAX_SAFE_INTEGER:', Number.MAX_SAFE_INTEGER);
assert.equal(String(plain[0].id), '1234567890123456800');
assert.equal(BigInt(plain[0].id), 1234567890123456768n);
assert.equal(Number.isSafeInteger(plain[0].id), false);
assert.equal(plain[1].id, 42);

// Doubles this big are 256 apart, so every ID from ...700 to ...828 lands on the same one.
assert.equal(1234567890123456700, 1234567890123456789);
assert.equal(1234567890123456828, 1234567890123456789);
assert.notEqual(1234567890123456900, 1234567890123456789);
// The first integer that changes on the way in: 2^53 + 1.
assert.equal(JSON.parse('9007199254740993'), 9007199254740992);
assert.equal(JSON.parse('9007199254740991'), Number.MAX_SAFE_INTEGER);

// 2. The source-text reviver keeps the digits, as strings, and only for the ID keys.
const exact = parseWithExactIds(text);
show('reviver id:', JSON.stringify(exact[0].id));
assert.equal(exact[0].id, '1234567890123456789');
assert.equal(exact[1].id, '42');
assert.equal(exact[0].total, 19.99);

// The same reviver to BigInt instead.
const big = JSON.parse(text, (key, value, context) => (key === 'id' ? BigInt(context.source) : value));
assert.equal(big[0].id, 1234567890123456789n);

// 3. The way back. A string ID serializes fine; a BigInt throws.
assert.equal(JSON.stringify({ id: exact[0].id }), '{"id":"1234567890123456789"}');
assert.throws(() => JSON.stringify({ id: big[0].id }), { name: 'TypeError', message: 'Do not know how to serialize a BigInt' });
// JSON.rawJSON writes the exact digits as a JSON number, for an API that won't take a string.
const back = JSON.stringify(exact[0], (key, value) => (key === 'id' ? JSON.rawJSON(value) : value));
show('JSON.rawJSON on the way back:', back);
assert.equal(back, '{"id":1234567890123456789,"customer":"Snowflake Ltd","total":19.99}');

// 4. How far away 2^53 is.
const secondsPerYear = 365.25 * 24 * 3600;
const yearsAt1000PerSecond = Number.MAX_SAFE_INTEGER / 1000 / secondsPerYear;
show('years to 2^53 at 1,000 rows/s:', Math.round(yearsAt1000PerSecond).toLocaleString('en-US'));
assert.ok(yearsAt1000PerSecond > 285_000 && yearsAt1000PerSecond < 286_000);
// A snowflake-style ID is a millisecond timestamp shifted left 22 bits.
const daysUntilPast2pow53 = 2 ** 31 / 1000 / 86400;
show('snowflake passes 2^53 after (days):', daysUntilPast2pow53.toFixed(1));
assert.ok((2n ** 31n << 22n) === 2n ** 53n);

console.log('\nnode-checks/parse.mjs: all assertions passed');
