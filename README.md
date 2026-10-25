# dotnet-long-id-angular-demo

Companion repo for the post
[Why a .NET long ID loses its last digits in Angular, and how to keep them](https://gdhami.net/blog/why-a-net-long-id-loses-its-last-digits-in-angular-and-how-to-keep-them).

A .NET 10 minimal API returns an order whose `long` ID is 1234567890123456789.
System.Text.Json writes it as a JSON number. An Angular 22 page reads it with
`HttpClient`, and the ID it gets is 1234567890123456800. Sending that back finds
nothing. The repo shows:

- the raw JSON the API writes, and what HttpClient hands the page (Playwright reads the page);
- that the way back (GET by id, PUT with the object) gets a 404, with no error anywhere;
- that it happens in `JSON.parse` itself (Node 26, no Angular);
- the fix on the .NET side: `[JsonNumberHandling(WriteAsString | AllowReadingFromString)]`
  on the ID property, and the round trip that then works;
- what a global `NumberHandling` setting does instead (every price becomes a string);
- what the OpenAPI document says, with and without the attribute (the same thing);
- the client-side fallback for an API you can't change: `responseType: 'text'` and a
  `JSON.parse` reviver that reads `context.source`;
- that TypeScript 6 needs a small declaration for that reviver, and TypeScript 7.1's
  `es2026` lib has it.

## Versions it was run on

| Tool | Version |
|---|---|
| .NET SDK | 10.0.201 |
| ASP.NET Core runtime | 10.0.5 |
| Microsoft.AspNetCore.OpenApi | 10.0.13 (brings Microsoft.OpenApi 2.12.2) |
| Microsoft.AspNetCore.Mvc.Testing | 10.0.5 |
| xUnit | 2.9.3 |
| Angular | 22.2.3 (CLI and @angular/build 22.2.4) |
| TypeScript | 6.0.3 (and 7.1.0-beta for the `es2026` lib check, done by hand) |
| Node | 26.1.0 |
| Playwright | 1.64.1 (Chromium 156.0.8078.4) |
| OS | Windows 11 |

## Run it

```bash
./check.sh          # or: pwsh ./check.ps1
```

That runs the .NET tests, the two Node checks, builds the Angular page into
`Api/wwwroot`, and runs Playwright (which starts the API on port 5351 itself).
Install the browser once with `npx playwright install chromium` inside `client/`
if Playwright asks for it.

To look at it by hand:

```bash
cd client && npm ci && npx ng build && cd ..
dotnet run --project Api --no-launch-profile --urls http://localhost:5351
curl -s http://localhost:5351/raw/orders      # the ID as a JSON number
curl -s http://localhost:5351/orders          # the ID as a string
curl -s http://localhost:5351/raw/orders/1234567890123456800   # 404
node node-checks/parse.mjs
```

Open `http://localhost:5351/` to see the three cases in a table.

## Layout

| Path | What it is |
|---|---|
| `Api/Orders.cs` | `RawOrder` (the default) and `Order` (the attribute on `Id`), and the two seeded orders |
| `Api/Program.cs` | `/raw/orders` and `/orders`, each with GET, GET by id and PUT; `GlobalNumbersAsStrings` switches on the global setting |
| `Tests/WireTests.cs` | The JSON text each endpoint writes, the 404 on the way back, the string round trip, web defaults, the global setting, the OpenAPI schema |
| `Tests/ShapeTests.cs` | The attribute on a `long?` and a `List<long>` |
| `client/src/app/app.ts` | The page: as is, string ID, source-text reviver; each sends the ID back |
| `client/src/app/parse-ids.ts` | The reviver |
| `client/src/json-source.d.ts` | The declaration TypeScript 6 needs for the reviver's third argument |
| `client/e2e/long-id.spec.ts` | Playwright reads the table and checks every cell |
| `node-checks/parse.mjs` | `JSON.parse` on its own, the reviver, BigInt and `JSON.rawJSON` on the way back, the 2^53 arithmetic |
| `node-checks/ts-types.mjs` | Compiles one probe with TypeScript 6, without and with the declaration |

## Edge cases the post leaves out

- **The double the page holds is not the number it shows.** The page shows
  1234567890123456800; the double in memory is 1234567890123456768
  (`BigInt(x)` prints it). JavaScript prints the shortest decimal that maps back
  to the same double. The server gets `...800` either way.
- **Near IDs collapse together.** Doubles around 1.2e18 are 256 apart, so a whole
  run of neighbouring IDs (two snowflakes from the same millisecond, say) turn
  into the same number. If the rounded value happens to be a real ID, the PUT
  updates the wrong row instead of returning 404.
- **The first integer that changes** is 2^53 + 1: `JSON.parse('9007199254740993')`
  gives 9007199254740992.
- **ASP.NET Core already reads quoted numbers.** `JsonSerializerDefaults.Web` sets
  `NumberHandling = AllowReadingFromString`, so the unchanged API accepts
  `"id":"1234567890123456789"` in a body. The attribute still carries
  `AllowReadingFromString` so the record reads back the same with plain
  `JsonSerializerOptions` (in a test, a background job, a message handler).
- **OpenAPI** (`Microsoft.AspNetCore.OpenApi` 10.0.13, document version 3.1.1) gives
  the ID `"type":["integer","string"]` with and without the attribute: it describes
  what the server reads, which the web defaults already widen. A generated
  client types it `number | string` either way. Say in the API notes that the ID
  is written as a string.
- **No custom converter needed** for `long?` or `List<long>`: the attribute covers
  both (see `ShapeTests`). Dictionary keys with `long` type are written as strings
  by System.Text.Json anyway.
- **BigInt instead of string.** `JSON.parse(text, (k, v, c) => k === 'id' ? BigInt(c.source) : v)`
  works, but `JSON.stringify` then throws `TypeError: Do not know how to serialize a BigInt`.
  `JSON.rawJSON(id.toString())` in a replacer writes the exact digits as a JSON number.
  The demo keeps strings.
- **Support for `context.source` and `JSON.rawJSON`** (MDN browser-compat-data 8.1.7):
  Chrome 114, Firefox 135, Safari 18.4, Node 21.
- **HttpClient has no parser hook.** Both backends call `JSON.parse(text)` with no
  reviver (`packages/common/http/src/fetch.ts` and `xhr.ts`). An interceptor sees
  the response after parsing. Hence `responseType: 'text'`.
- **Port 5351** is hard-coded in `client/playwright.config.ts`. Change it there if
  something else on your machine uses it.

## License

MIT, see `LICENSE`.
