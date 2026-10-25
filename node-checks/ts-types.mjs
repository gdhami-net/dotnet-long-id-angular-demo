// TypeScript 6 (the version Angular 22 uses) doesn't type the reviver's
// third argument. This compiles one probe without and with the declaration.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const tsc = here('../client/node_modules/typescript/bin/tsc');
const args = ['--noEmit', '--strict', '--target', 'es2022', '--lib', 'es2025,dom'];
const run = (...files) => spawnSync(process.execPath, [tsc, ...args, ...files], { encoding: 'utf8' });

const version = spawnSync(process.execPath, [tsc, '-v'], { encoding: 'utf8' }).stdout.trim();
const without = run(here('ts/probe.ts'));
console.log(`${version}, without the declaration:\n${without.stdout.trim().split('\n').slice(0, 2).join('\n')}`);
assert.notEqual(without.status, 0);
assert.match(without.stdout, /TS2345/);

const withDecl = run(here('../client/src/json-source.d.ts'), here('ts/probe.ts'));
console.log(`with client/src/json-source.d.ts: exit ${withDecl.status}`);
assert.equal(withDecl.status, 0, withDecl.stdout);

console.log('\nnode-checks/ts-types.mjs: all assertions passed');
