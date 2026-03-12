# RDKit-ESM

RDKit minimal lib for the modern web.

A typed ESM wrapper around [RDKit](https://www.rdkit.org/)'s WebAssembly MinimalLib. Instead of manually serializing and deserializing JSON strings to interact with the raw WASM API, you get a direct TypeScript interface with full autocomplete and compile-time validation of every option.

**Features:** molecule parsing, substructure search, molecular descriptors, fingerprints (Morgan, MACCS, pattern, ...), reactions, Maximum Common Substructure, R-group decomposition, SVG and Canvas rendering.

## Acknowledgment

This library is based on the RDKit project and it's RDKit-js distribution. We thank the RDKit community for their contributions,
in particular Michel Moreau and Paolo Tosco for maintaining the MinimalLib and the RDKit-js distribution. The initial types
definitions at the basis of this project had been written by Ádám Baróthi.

## Installation

```bash
npm install rdkit-esm
```

## Quick Start

```ts
import { initRDKit } from 'rdkit-esm';

// Initialization is async — await it before calling any other method
const rdkit = await initRDKit();

const mol = rdkit.getMol('c1ccccc1');
if (mol) {
  mol.getSmiles(); // 'c1ccccc1'
  mol.getDescriptors(); // { exactMW: 78.047, ClogP: 1.6816, ... }
  mol.getSvg({ width: 350, height: 300 });

  mol.delete(); // free WASM memory when done
}
```

## API Overview

### `initRDKit(options?): Promise<RDKit>`

Loads the WASM module and returns the main interface. **Must be awaited** before any other call.

### `RDKit`

The main entry point for creating molecules, reactions, and collections.

| Method                              | Description                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| `getMol(input, options?)`           | Create a `Mol` from SMILES, SMARTS, MolFile, or JSON. Returns `null` on invalid input. |
| `getQMol(input)`                    | Create a query `Mol` from a SMARTS string or a query MolFile.                          |
| `getMolCollection(molStrings?)`     | Create a `MolCollection`, optionally from an array of SMILES or other formats.         |
| `getRxn(input, options?)`           | Create a `Reaction` from reaction SMARTS, SMILES, or an RXN block.                     |
| `getMCS(mols, options?)`            | Compute the Maximum Common Substructure across a set of molecules.                     |
| `getRGD(core, molecules, options?)` | R-Group Decomposition against one or more core structures.                             |
| `molzip(mol1, mol2)`                | Combine two molecules.                                                                 |
| `version`                           | RDKit version string.                                                                  |
| `module`                            | Raw `RDKitModule` for direct WASM access.                                              |

### `Mol`

Wraps a single molecule with a typed, camelCase API.

- **String representations** — `getSmiles()`, `getCxSmiles()`, `getSmarts()`, `getMolblock()`, `getV3KMolblock()`, `getInchi()`, `getInchikey()`, `getJson()`
- **Fingerprints** — `getMorganFp()`, `getMaccsFp()`, `getPatternFp()`, `getTopologicalTorsionFp()`, `getRdkitFp()`, `getAtomPairFp()` (each also available as `…AsUint8Array()`)
- **Descriptors** — `getDescriptors()` returns MW, ClogP, HBA, HBD, ring counts, etc.
- **Substructure** — `getSubstructMatch(query)`, `getSubstructMatches(query)`
- **Drawing** — `getSvg(options?)`, `drawToCanvas(canvas, ...)`
- **Coordinates** — `setNewCoords()`, `generateAlignedCoords(template, options?)`
- **Mutations** — `addHs()` / `removeHs()`, `convertToAromaticForm()` / `convertToKekuleForm()`, `combineWith()`, `zipWith()`
- **Properties** — `hasProp()`, `getProp()`, `setProp()`, `clearProp()`, `getPropList()`
- **Info** — `isValid()`, `getNumAtoms()`, `getNumBonds()`, `hasCoords()`, `getStereoTags()`

### `MolCollection`

An iterable collection of molecules.

| Method                | Description                                              |
| --------------------- | -------------------------------------------------------- |
| `at(i)`               | Get molecule at index (returns `null` if out of bounds). |
| `push(mol)`           | Append a molecule, returns new size.                     |
| `size()`              | Number of molecules.                                     |
| `[Symbol.iterator]()` | Iterate over molecules with `for...of`.                  |

### `Reaction`

| Method                                  | Description                                                   |
| --------------------------------------- | ------------------------------------------------------------- |
| `runReactants(reactants, maxProducts?)` | Run the reaction on a set of reactants. Returns product sets. |
| `getSvg(options?)`                      | Render the reaction as SVG.                                   |
| `drawToCanvas(canvas, ...)`             | Draw the reaction to an HTML canvas.                          |

## Memory Management

RDKit objects live in WASM memory and **must** be freed explicitly to avoid leaks. Call `.delete()` on every `Mol`, `MolCollection`, and `Reaction` when you are done with it.

```ts
const mol = rdkit.getMol('CCO');
// ... use mol ...
mol?.delete();
```

All classes also implement the `Disposable` interface. In environments that support `using` declarations (Node.js 22+, or TypeScript with downlevel emit), you can let scope exit handle cleanup automatically — note that this is not yet widely supported in browsers.

```ts
using mol = rdkit.getMol('CCO')!;
// mol is deleted automatically when the scope exits
```

## Development

```bash
# Install dependencies
pnpm install

# Run the unit tests
pnpm test

# Build for distribution
pnpm build

# Type-check
pnpm typecheck

# Format code
pnpm fmt
```

### Upgrading RDKit MinimalLib

The `MinimalLib/` directory contains a copy of the RDKit MinimalLib compilation output. To upgrade to a newer RDKit version, replace the contents of `MinimalLib/dist/` with the WASM and JS files from the new build.

## License

[MIT](LICENSE)
