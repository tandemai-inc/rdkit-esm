# RDKit-ESM

RDKit-ESM is a library wrapping the RDKit MinimalLib WASM port of RDKit for easier distribution and usage in modern JS environment.

## Context: project overview

- compiled artifacts from RDKit are in ./MinimalLib/dist
- manually maintained typings for MinimalLib are in ./src/types/rdkit-minimalib-typings.d.ts. The shape of the JSON objects are in /src/types/rdkit-minimalib-json-typings.d.ts.
- main code is in ./src
- the library is bundled using tsdown, distributed in ESM format only. Package contains the WASM asset, which must be bundled by third party consumers.

## Principles

- Cover same functionnalities as the original library
- Improve APIs where it can reduce complexity for users (hide implementation details)
- Make memory management easier (implement Disposable, add .delete() methods where useful)
- Refer to the RDKit source code for authoritative documentation: `tests.js`, `minilib.cpp`, `common.h`, `jswrapper.cpp`, `JSONParsers.cpp` and other files where functions parameters are defined
- Enrich typescript documentation for parameters
- If something goes sideways, stop an discuss the implementation decisions
- This project is too niche for your training data

## Commands

```bash
pnpm build          # Bundle with tsdown (rolldown)
pnpm dev            # Watch mode build
pnpm test           # Run all tests with vitest
pnpm test <file>    # Run a single test file, e.g. pnpm test tests/mol.test.ts
pnpm coverage       # V8 coverage report (html + text)
pnpm typecheck      # Type-check with tsgo
pnpm fmt            # Format with oxfmt
pnpm fmt:check      # Check formatting without writing
```

## Architecture

This library's primary goal is to expose idiomatic JavaScript/TypeScript patterns in place of the raw WASM communication model. The RDKit MinimalLib WASM module communicates entirely through strings: options are passed as `JSON.stringify(details)` and results are returned as raw JSON strings or opaque types that callers must manually parse and free. This wrapper absorbs all of that — it parses JSON results into typed objects, accepts typed options structs (serializing them internally), exposes camelCase methods instead of snake_case, and adds `Disposable`/`using` memory safety so callers never touch WASM heap pointers directly.

Concretely: instead of `mol.get_svg(600, 400, JSON.stringify({ addStereoAnnotation: true }))` returning a raw SVG string from a WASM object the caller must later `.delete()`, the wrapper exposes `mol.getSVG({ width: 600, height: 400, addStereoAnnotation: true })` and handles lifetime automatically.

### Initialization flow

`init.ts` exports `initRDKit()`, which loads the WASM binary and returns an `RDKit` instance. The WASM is imported with `?url` suffix using `rolldown-plugin-wasm`. Do not try to remove this plugin. The init code detects Node.js vs browser to handle file vs fetch loading respectively. Node support is useful for unit testing.

### Class hierarchy

- **`RDKit`** (`rdkit.ts`) — top-level class. Holds the WASM `RDKitModule` reference (`protected mod`) and a `RDKitLogger` instance. Exposes molecule/reaction/MCS/RGD factory methods, plus `configure()` for global settings.
- **`Mol`** (`mol.ts`) — wraps `JSMol`. The largest class; covers all string/binary output formats, fingerprints, descriptors, depiction, coordinate generation, substructure, mutations, hydrogen management, properties, fragments. Implements `Disposable`.
- **`Reaction`** (`reaction.ts`) — wraps `JSReaction`. Implements `Disposable`.
- **`MolArray`** (`mol-array.ts`) — `Array<Mol>` subclass with batch `delete()` and `Symbol.dispose` for bulk lifecycle management.
- **`Fingerprint`** (`fingerprints/fingerprint.ts`) — wraps the three raw variants (string / binary_text / uint8array) into one object with `onBits`, `fpU8`, `fpU32`, `toString()`, `nBits`, `type`.
- **`RDKitLogger`** (`logger.ts`) — manages WASM log capture/tee, single error listener slot, `throwOnError` support. All error handling in `getMol`/`getQMol`/`getRxn` routes through this.

### Type files

- `src/types/rdkit-minimalib-typings.d.ts` — raw WASM module interface (`RDKitModule`, `JSMol`, `JSReaction`, etc.)
- `src/types/rdkit-minimalib-json-typings.d.ts` — types for the JSON `details` parameters passed to WASM methods
- `src/types/rdkit-esm.typings.ts` — wrapper-level types (configure options, events, CxSmiles fields, etc.)

### Error handling pattern

`getMol()`, `getQMol()`, `getRxn()` return `null` on failure by default. Pass `{ throwOnError: true }` to throw `RDKitParseError` instead. Register `rdkit.events.addErrorListener(cb)` to receive `{ input, message, operation }` on any parse failure regardless of throw mode.

### Memory management

Every `Mol`, `Reaction`, `MolArray`, `MCSResult`, and `RGDResult` holds WASM heap memory that must be freed. Use `using mol = rdkit.getMol(...)` (explicit resource management) or call `.delete()` manually. Methods that return allocated objects (e.g. `getFrags()`, `copy()`) have `@warning` JSDoc annotations.

### WASM options serialization

Wrapper methods that accept options objects call `JSON.stringify(options)` and pass the result to the corresponding WASM method. This means the TypeScript option types must match the JSON keys the C++ parser expects — see `src/types/rdkit-minimalib-json-typings.d.ts` for the types.

## Code style

- Use `type` not `interface`
- Use TypeScript `private`/`protected` instead of `#` (hard private). We want consumers to be able to extend the library. Use `protected` for fields subclasses may need; `private` for purely internal implementation details.
- When a `protected` field name would conflict with a public getter of the same name, prefix the field with `_` (e.g. `protected _jsMol` backing `get jsMol()`). No prefix needed when there is no conflict (e.g. `protected module`).
- Single quotes (enforced by oxfmt)

## Test patterns

- `tests/original-*.test.ts` are direct ports of the C++ MinimalLib `tests.js` test suite. Keep them structurally close to the original — same test names, same molecule inputs where possible.
- `it.fails()` marks a test body that is expected to throw. Use this for TDD when a wrapper feature is not yet implemented. If the body passes without error, Vitest reports the test as failed.
- `Mol.resolveQuery()` (private helper) accepts either a `Mol` or a SMARTS string and returns a `[JSMol, shouldDelete]` tuple. All substructure methods delegate to it to avoid duplicating query lifecycle logic.

## Playground

`playground.test.ts` (gitignored) is a scratch file for exploring raw MinimalLib output before designing wrapper APIs. Use it to inspect actual return shapes, verify null behaviour, and test round-trips without writing formal test assertions.

```bash
pnpm vitest run playground.test.ts
```

Access the raw WASM API via `mol.jsMol` and `rdkit.module` directly in the playground. Prefer this over inferring behaviour from C++ source alone.

## Key reference files

- The RDKit MinimalLib C++ source (`minilib.cpp`, `common.h`, `jswrapper.cpp`, `JSONParsers.cpp`) is the authoritative reference for what the WASM actually accepts
- The original MinimalLib `tests.js` is the source for the `tests/original-*.test.ts` test files in this repo
