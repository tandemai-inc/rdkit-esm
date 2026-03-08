import type { MolList, RDKitModule } from './types/rdkit-typings.d.ts';
import { Mol } from './mol.ts';

/**
 * A wrapper around RDKit's MolList providing a typed, iterable API.
 *
 * @remarks
 * MolCollection instances are typically obtained from {@link Mol.getFrags},
 * not created directly by consumers.
 *
 * Implements `Disposable` for use with the `using` keyword:
 * ```ts
 * using frags = mol.getFrags();
 * for (const frag of frags.mols) {
 *   console.log(frag.getSmiles());
 * }
 * ```
 */
export class MolCollection implements Disposable {
  #molList: MolList | null;
  #module: RDKitModule;

  /**
   * Creates a MolCollection from an array of molecule strings.
   * (SMILES, MolBlocks, etc. — any format accepted by `getMol`).
   * Invalid strings are silently skipped.
   *
   * @param input - Array of molecule strings
   * @param module - The RDKit WASM module
   */
  static fromArray(input: string[], module: RDKitModule): MolCollection {
    const molList = new module.MolList();
    for (const s of input) {
      const jsMol = module.get_mol(s);
      if (jsMol && jsMol.is_valid()) {
        molList.append(jsMol);
      }
      jsMol?.delete();
    }
    return new MolCollection(molList, module);
  }

  constructor(molList: MolList, module: RDKitModule) {
    this.#molList = molList;
    this.#module = module;
  }

  /**
   * The underlying MolList object for direct access to the raw API.
   * @throws If the collection has been deleted.
   */
  get molList(): MolList {
    if (!this.#molList) {
      throw new Error('MolCollection has been deleted');
    }
    return this.#molList;
  }

  /** Returns the molecule at the given index, or null if out of bounds */
  at(i: number): Mol | null {
    const jsMol = this.molList.at(i);
    if (!jsMol) return null;
    return new Mol(jsMol, this.#module);
  }

  /** Returns the number of molecules in the collection */
  size(): number {
    return this.molList.size();
  }

  /** Appends a molecule to the collection and returns the new size */
  push(mol: Mol): number {
    return this.molList.append(mol.jsMol);
  }

  /** Iterates over the molecules in the collection */
  *[Symbol.iterator](): Iterator<Mol> {
    const list = this.molList;
    list.reset();
    while (!list.at_end()) {
      const jsMol = list.next();
      if (!jsMol) break;
      yield new Mol(jsMol, this.#module);
    }
  }

  /**
   * Deletes the underlying C++ MolList object from memory.
   */
  delete(): void {
    this.#molList?.delete();
    this.#molList = null;
  }

  /** Disposable support — allows use with the `using` keyword */
  [Symbol.dispose](): void {
    this.delete();
  }
}
