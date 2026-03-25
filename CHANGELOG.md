# Changelog

## [vX.X.X] Unreleased

## [v0.5.0]

- errors interception: console.log `configure({ enableLogging: bool })`, event listener `addErrorListener(cb: (e: Error))`, throwOnError opt-in
- condenseAbbreviations returns a substructure match
- add `numHeavyAtoms` getter and `getCoords()` to Mol class
- add `delete()` to returned objects containing reference to WASM instances
- add `configure()` to main rdkit class for coordgen/legacy stereo/non tetrahedral stereo settings

## [v0.4.3]

- RDKit minimalib typings feature complete
- Export types for CommonChem entities (RDKitJsonAtoms, etc...)

## [v0.4.2]

- fix: configure module build for browser (was neutral). Fixes bundling by third parties for browsers.

## [v0.4.1]

- fix: fingerprint text output

## [v0.4.0]

- BREAKING `get...Fp` methods to return a Fingerprint object
- Added Fingerprints similarity utilities `rdkit.computeFingerprintsSimilarity`

## [v0.3.0] - 2026-03-16

- Fix node support in consumers applications
