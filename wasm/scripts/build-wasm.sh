#!/usr/bin/env bash
# Extract RDKit at wasm/RDKIT_SHA into a temp dir, inject extras, run official
# MinimalLib docker, vendor dist. No RDKit checkout is modified. Requires Docker.
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
WASM_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
WRAPPER_ROOT=$(cd "$WASM_DIR/.." && pwd)
RDKIT_SRC=${RDKIT_SRC:-}
RDKIT_SHA=$(tr -d '[:space:]' < "$WASM_DIR/RDKIT_SHA")
CACHE_DIR="$WASM_DIR/.cache"
EXTRAS_CPP="$WASM_DIR/extras/forcefield.cpp"
PATCH="$WASM_DIR/patches/0001-minilib-forcefield-extras.patch"
DIST_DIR="$WRAPPER_ROOT/MinimalLib/dist"
BUILD_TREE=""
CHECK_ONLY=0

usage() {
  cat <<'EOF'
Usage: wasm/scripts/build-wasm.sh [--check-patch]

Wraps RDKit Code/MinimalLib/scripts/build_rdkitjs.sh with GET_SRC=copy.

  1. Extracts RDKit at wasm/RDKIT_SHA into a temp dir
     (GitHub tarball cached in wasm/.cache/, or git archive from $RDKIT_SRC)
  2. Copies extras/forcefield.cpp → Code/MinimalLib/forcefield.cpp
  3. git apply --check then git apply the extras patch
  4. Official docker build
  5. Copies RDKit_minimal.{js,wasm} into MinimalLib/dist/

Options:
  --check-patch   Stop after checking that the patch applies (no docker)
  -h, --help      Show this help

Env:
  RDKIT_SRC     optional local RDKit git checkout to export the pinned commit
                from (offline). Default: download the commit from GitHub.
EOF
}

case "${1:-}" in
  -h | --help)
    usage
    exit 0
    ;;
  --check-patch) CHECK_ONLY=1 ;;
  "") ;;
  *)
    echo "unknown argument: $1" >&2
    usage >&2
    exit 1
    ;;
esac

if [[ ! -f "$EXTRAS_CPP" ]]; then
  echo "missing extras file: $EXTRAS_CPP" >&2
  exit 1
fi
if [[ ! -f "$PATCH" ]]; then
  echo "missing extras patch: $PATCH" >&2
  exit 1
fi
if [[ ! "$RDKIT_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "wasm/RDKIT_SHA must be a full 40-character commit SHA, got: $RDKIT_SHA" >&2
  exit 1
fi

cleanup() {
  if [[ -n "$BUILD_TREE" ]]; then
    rm -rf "$BUILD_TREE"
  fi
}
trap cleanup EXIT

BUILD_TREE=$(mktemp -d /tmp/rdkit-wasm.XXXXXX)

if [[ -n "$RDKIT_SRC" ]]; then
  if ! git -C "$RDKIT_SRC" cat-file -e "$RDKIT_SHA^{commit}" 2>/dev/null; then
    echo "commit $RDKIT_SHA not found in RDKIT_SRC=$RDKIT_SRC (git fetch it first)" >&2
    exit 1
  fi
  echo "Exporting RDKit $RDKIT_SHA from $RDKIT_SRC"
  git -C "$RDKIT_SRC" archive "$RDKIT_SHA" | tar -x -C "$BUILD_TREE"
else
  TARBALL="$CACHE_DIR/rdkit-$RDKIT_SHA.tar.gz"
  if [[ ! -f "$TARBALL" ]]; then
    mkdir -p "$CACHE_DIR"
    echo "Downloading RDKit $RDKIT_SHA into $CACHE_DIR"
    curl -fL --retry 3 -o "$TARBALL.part" "https://codeload.github.com/rdkit/rdkit/tar.gz/$RDKIT_SHA"
    mv "$TARBALL.part" "$TARBALL"
  fi
  echo "Extracting $TARBALL"
  # GitHub tarballs have a single top-level rdkit-<sha>/ directory.
  tar -xzf "$TARBALL" --strip-components=1 -C "$BUILD_TREE"
fi

cp "$EXTRAS_CPP" "$BUILD_TREE/Code/MinimalLib/forcefield.cpp"
# BUILD_TREE is not a git repo; git apply then behaves like patch.
git -C "$BUILD_TREE" apply --check "$PATCH"
if [[ "$CHECK_ONLY" -eq 1 ]]; then
  echo "Extras patch applies cleanly to RDKit $RDKIT_SHA"
  exit 0
fi
git -C "$BUILD_TREE" apply "$PATCH"

# Official entry point. GET_SRC=copy is required (clone branch-arg is mismatched).
# build_rdkitjs.sh does `realpath build` before mkdir; that fails if build/ is missing.
# This is Code/MinimalLib/build in the extracted RDKit tree — not wasm/, not the package root.
cd "$BUILD_TREE/Code/MinimalLib"
mkdir -p build
export GET_SRC=copy
bash scripts/build_rdkitjs.sh

mkdir -p "$DIST_DIR"
# Docker export lands at Code/MinimalLib/build/ (sometimes with a nested dist/).
copied=0
for dir in build/dist build; do
  if [[ -f "$dir/RDKit_minimal.wasm" && -f "$dir/RDKit_minimal.js" ]]; then
    cp -f "$dir/RDKit_minimal.js" "$dir/RDKit_minimal.wasm" "$DIST_DIR/"
    copied=1
    break
  fi
done
if [[ "$copied" -ne 1 ]]; then
  echo "could not find RDKit_minimal.{js,wasm} under build/ or build/dist/" >&2
  ls -la build build/dist 2>/dev/null || true
  exit 1
fi
if [[ ! -f "$DIST_DIR/RDKit_minimal.wasm" ]]; then
  echo "missing $DIST_DIR/RDKit_minimal.wasm after copy" >&2
  exit 1
fi

echo "Vendored RDKit_minimal.{js,wasm} into $DIST_DIR"
echo "Next: cd $WRAPPER_ROOT && pnpm test"
