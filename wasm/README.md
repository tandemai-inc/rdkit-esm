# Building `RDKit_minimal.wasm`

`MinimalLib/dist/RDKit_minimal.{js,wasm}` is RDKit's official MinimalLib build plus a small set of extra C++ functions for force fields and conformer generation (`run_forcefield`, `generate_conformers`). This folder contains everything needed to rebuild it from a pinned RDKit commit with RDKit's own Docker build.

You only need this when upgrading RDKit or changing the extras. Day-to-day work (`pnpm test`, `pnpm build`) uses the committed files in `MinimalLib/dist/`.

## Quick start

Requirements: bash, git, curl, tar and a running Docker daemon. The build's Docker images take about 12 GB of disk.

```bash
bash wasm/scripts/build-wasm.sh   # fetch RDKit, add the extras, build, copy into MinimalLib/dist/
pnpm test                         # check the wrapper against the new binary
```

The first run builds the dependency image (emscripten, Boost, FreeType, …) and is slow. Later runs reuse the cached `rdkit-minimallib-deps` image and only recompile RDKit.

## What the script does

1. Reads the RDKit commit from `wasm/RDKIT_SHA`.
2. Gets RDKit's source at that commit. By default it downloads `https://codeload.github.com/rdkit/rdkit/tar.gz/<sha>` into `wasm/.cache/` (gitignored, reused on later runs). If `RDKIT_SRC` is set, it exports the commit from that local checkout instead.
3. Unpacks the source into a temporary directory, `/tmp/rdkit-wasm.*`, which is deleted when the script exits.
4. Copies `extras/forcefield.cpp` into `Code/MinimalLib/` and applies `patches/0001-minilib-forcefield-extras.patch`.
5. Runs RDKit's `Code/MinimalLib/scripts/build_rdkitjs.sh` with `GET_SRC=copy`. This compiles inside Docker and runs RDKit's MinimalLib JS tests (`tests.js`) on the result; the build fails if they fail.
6. Copies `RDKit_minimal.js` and `RDKit_minimal.wasm` into `MinimalLib/dist/`.

No RDKit checkout is modified and nothing is committed.

## Options

| Option / variable          | Effect                                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--check-patch`            | Run steps 1–4 as a dry run (`git apply --check`), then exit. Takes seconds and doesn't use Docker.                                                             |
| `-h`, `--help`             | Show usage.                                                                                                                                                    |
| `RDKIT_SRC=/path/to/rdkit` | Export the source from this local git checkout instead of downloading it (e.g. offline). It must contain the pinned commit; its current branch doesn't matter. |

## Common tasks

### Upgrade RDKit

1. Pick a commit and write its full 40-character SHA into `wasm/RDKIT_SHA`. Any commit from `rdkit/rdkit` works, not only release tags. To get the latest `master`:

   ```bash
   git ls-remote https://github.com/rdkit/rdkit.git refs/heads/master
   ```

   We track `master` rather than `Release_2026_03_*` because the Docker WASM build on 2026.03.x lacks later emscripten and Docker fixes.

2. Check that the patch still applies:

   ```bash
   bash wasm/scripts/build-wasm.sh --check-patch
   ```

   If it doesn't, see [Update the patch](#update-the-patch). A clean patch doesn't guarantee `extras/forcefield.cpp` still compiles: RDKit API changes (`ForceField::minimize`, `ETKDGv3`, `EmbedParameters`) only show up in the full build.

3. Build and test: `bash wasm/scripts/build-wasm.sh && pnpm test`.
4. Bump the package version and add a CHANGELOG entry (`Upgrade minimalLib to RDKit <version>`). The RDKit version is in the root `CMakeLists.txt` (`RDKit_Year`, `RDKit_Month`, `RDKit_Revision`).

### Change the extras

- **Change the implementation** in `extras/forcefield.cpp`: rebuild. The patch doesn't change.
- **Add a function or change a signature** exposed to JS: update the declaration in `minilib.h` and the binding in `jswrapper.cpp`, which means [updating the patch](#update-the-patch). Then update `src/types/rdkit-minimalib-typings.d.ts` to match.
- **Link another RDKit library**: add it to `MINIMAL_LIB_LIBRARIES` in the patch's `CMakeLists.txt` section.

### Update the patch

The patch is a plain `git diff` of three files in the RDKit tree. To edit or rebase it, work in a throwaway copy of the source:

```bash
bash wasm/scripts/build-wasm.sh --check-patch   # puts the tarball in wasm/.cache/ (fine if the check fails)

SHA=$(cat wasm/RDKIT_SHA)
PATCH=$PWD/wasm/patches/0001-minilib-forcefield-extras.patch
TREE=$(mktemp -d)
tar -xzf "wasm/.cache/rdkit-$SHA.tar.gz" --strip-components=1 -C "$TREE"

cd "$TREE"
git init -q && git -c core.autocrlf=false add -A && git commit -qm "rdkit $SHA"
git apply --reject "$PATCH"   # applies what it can; fix any *.rej hunks by hand

# edit Code/MinimalLib/CMakeLists.txt, minilib.h, jswrapper.cpp, then:
git diff -- Code/MinimalLib/CMakeLists.txt Code/MinimalLib/minilib.h Code/MinimalLib/jswrapper.cpp > "$PATCH"
```

Keep `forcefield.cpp` out of the patch: it lives in `extras/` and the script copies it in separately.

### Debug a failing Docker stage

`build_rdkitjs.sh` chains four Dockerfiles from `Code/MinimalLib/docker/`. To run them one at a time, prepare a tree as in [Update the patch](#update-the-patch), with the patch applied and `extras/forcefield.cpp` copied into `Code/MinimalLib/`, then:

```bash
cd "$TREE/Code/MinimalLib/docker"

docker build --target deps-stage -t rdkit-minimallib-deps \
  --build-arg "EXCEPTION_HANDLING=-fwasm-exceptions" \
  -f 01_deps.Dockerfile .

docker build --target local-src-stage -t rdkit-minimallib-rdkit-src \
  -f 02_rdkit_copy.Dockerfile ../../..

docker build -t rdkit-minimallib \
  --build-arg "EXCEPTION_HANDLING=-fwasm-exceptions" \
  -f 03_build.Dockerfile .

DOCKER_BUILDKIT=1 docker build -f 04_export.Dockerfile -o ../build .
```

Artifacts end up in `Code/MinimalLib/build/` of that tree.

## Reference

### How the extras are wired in

The patch leaves `minilib.cpp` alone so it stays small and easy to rebase. It changes three files in `Code/MinimalLib/`:

- `CMakeLists.txt` compiles `forcefield.cpp` and links `ForceFieldHelpers`, `ForceField`, `Trajectory`, `DistGeomHelpers`, `DistGeometry`, `MolAlign` and `Alignment`.
- `minilib.h` declares `JSMolBase::run_forcefield(details)` and `JSMolBase::generate_conformers(details)`.
- `jswrapper.cpp` exposes both through Embind with snake_case names, like the rest of MinimalLib.

Both functions follow MinimalLib conventions: they take a JSON `details` string and return a JSON string, or `""` on failure with the reason logged to `rdApp.error`. Unknown keys are ignored; negative or non-integer counts are rejected.

- `run_forcefield` runs an `energy` or `minimize` job with MMFF94 on the first conformer, falling back to UFF when MMFF94 has no parameters. `minimize` updates the conformer in place.
- `generate_conformers` replaces the molecule's conformers with ETKDGv3 embeddings, optionally minimized.

Option and result shapes are typed in `src/types/rdkit-minimalib-json-typings.d.ts`; the wrapper exposes them as `Mol.getForceFieldEnergy()`, `Mol.minimize()` and `Mol.generateConformers()`. `add_hs` / `add_hs_in_place` already exist upstream, so the extras don't add them.

### Build settings

The build uses RDKit's official Docker settings (`Code/MinimalLib/docker/03_build.Dockerfile`) unchanged, including InChI and CoordGen support. Keep it that way rather than turning features off to shrink the binary. The force-field code makes the WASM larger than stock MinimalLib (8.2 MB instead of 7.3 MB).

`src/init.ts` relies on these emscripten flags. If an RDKit upgrade changes them, `initRDKit()` needs updating:

| Flag                                                  | Why it matters                                                                     |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `-s MODULARIZE=1`, `-s EXPORT_NAME='initRDKitModule'` | `RDKit_minimal.js` exports an `initRDKitModule` factory, which `init.ts` imports.  |
| `-s ALLOW_MEMORY_GROWTH=1`, `-s MAXIMUM_MEMORY=4GB`   | The WASM heap grows as needed, up to 4 GB.                                         |
| `-s USE_PTHREADS=0`                                   | Single-threaded, so no `SharedArrayBuffer` requirement; ETKDG uses `numThreads=1`. |
| `--bind`                                              | Enables Embind (set in `Code/MinimalLib/CMakeLists.txt`).                          |

### Why `GET_SRC=copy`

`build_rdkitjs.sh` can also clone RDKit inside Docker (`GET_SRC=clone`), but that mode is currently broken: the script passes `RDKIT_GIT_BRANCH` while `02_rdkit_clone.Dockerfile` reads `RDKIT_BRANCH`. It also has no way to add the extras. Copy mode builds from the tree the script has prepared.

## Files

```
wasm/
  RDKIT_SHA                 # pinned RDKit commit
  RDKIT-LICENSE.txt         # RDKit's BSD-3-Clause license
  extras/forcefield.cpp     # force-field and conformer implementations
  patches/0001-minilib-forcefield-extras.patch
                            # CMakeLists.txt, minilib.h and jswrapper.cpp changes
  scripts/build-wasm.sh     # build script
  .cache/                   # downloaded RDKit tarballs (gitignored)
```

## License

- The WASM binary contains RDKit, licensed BSD-3-Clause (`RDKIT-LICENSE.txt`, copied from RDKit's `license.txt`).
- `extras/forcefield.cpp` is adapted from Molarium (Apache-2.0); the potentials and gradients it calls are RDKit's (BSD-3-Clause). Its JS names follow MinimalLib's `snake_case` convention, not Molarium's `molarium_*` names.
- The TypeScript wrapper is MIT.
