import type { MolList, RDKitModule } from './types/rdkit-minimalib-typings';
import { Mol } from './mol.ts';

/**
 * An array of {@link Mol} instances with batch lifecycle management.
 *
 * Extends the native `Array` so all standard array methods (indexing,
 * iteration, `map`, `filter`, …) work out of the box.
 *
 * Call {@link delete} (or use the `using` keyword) to delete every `Mol`
 * in the array at once.
 */
export class MolArray extends Array<Mol> implements Disposable {
  /** Deletes every Mol in this array */
  delete(): void {
    for (const mol of this) mol.delete();
  }

  /** Disposable support — allows use with the `using` keyword */
  [Symbol.dispose](): void {
    this.delete();
  }
}

/**
 * Builds a temporary WASM MolList from an array of Mol instances.
 * The caller is responsible for deleting the returned MolList.
 *
 * @internal
 */
export function fromMolArraytoMolList(mols: Mol[], module: RDKitModule): MolList {
  const list = new module.MolList();
  for (const mol of mols) {
    list.append(mol.jsMol);
  }
  return list;
}

/**
 * Builds a temporary WASM MolList from an array of Mol instances.
 * The caller is responsible for deleting the returned MolList.
 *
 * @internal
 */
export function fromStringArraytoMolList(
  mols: string[],
  module: RDKitModule,
  isQuery = false,
): MolList {
  const list = new module.MolList();
  for (const s of mols) {
    const mol = isQuery ? module.get_qmol(s) : module.get_mol(s);
    if (!mol) continue;
    list.append(mol);
    mol.delete();
  }
  return list;
}

export const isMolArray = (arr: any[]): arr is Mol[] => arr.length > 0 && arr[0] instanceof Mol;
