import type { JSReaction, RDKitModule, MolList } from './types/rdkit-minimalib-typings';
import type { RDKitRxnDepictionDetails } from './types/rdkit-minimalib-json-typings';
import { Mol } from './mol.ts';
import {
  fromMolArraytoMolList,
  fromStringArraytoMolList,
  isMolArray,
  MolArray,
} from './mol-array.ts';

/**
 * A wrapper around RDKit's JSReaction object providing a typed, camelCase API.
 *
 * @remarks
 * Reaction instances are created via {@link RDKit.getRxn}, not directly by consumers.
 *
 * Implements `Disposable` for use with the `using` keyword:
 * ```ts
 * using rxn = rdkit.getRxn('[CH3:1][OH:2]>>[CH2:1]=[OH0:2]')!;
 * const products = rxn.runReactants(['CO']);
 * ```
 */
export class Reaction implements Disposable {
  #jsReaction: JSReaction | null;
  #module: RDKitModule;

  constructor(jsReaction: JSReaction, module: RDKitModule) {
    this.#jsReaction = jsReaction;
    this.#module = module;
  }

  /**
   * The underlying JSReaction object for direct access to the raw API.
   * @throws If the reaction has been deleted.
   */
  get jsReaction(): JSReaction {
    if (!this.#jsReaction) {
      throw new Error('Reaction has been deleted');
    }
    return this.#jsReaction;
  }

  /**
   * Runs the reaction on a set of reactants.
   *
   * Returns an array of product sets. Each product set is an array of `Mol`
   * instances corresponding to one match between the reactants and the
   * reaction definition.
   *
   * **WARNING:** The caller is responsible for deleting each returned `Mol`
   * (via `.delete()` or `using`) to avoid memory leaks.
   *
   * @param reactants - An array of Mol instances or molecule strings
   *   (SMILES, MolBlocks, etc.)
   * @param maxProducts - Maximum number of product sets to return (default: 1000)
   * @returns An array of product sets, where each set is an array of Mol instances
   */
  runReactants(reactants: Mol[] | string[], maxProducts = 1000): MolArray[] {
    let molList: MolList;

    if (isMolArray(reactants)) {
      molList = fromMolArraytoMolList(reactants, this.#module);
    } else {
      molList = fromStringArraytoMolList(reactants, this.#module);
    }

    const products = this.jsReaction.run_reactants(molList, maxProducts);

    molList.delete();

    const result = [];
    for (let i = 0; i < products.size(); i++) {
      const productSet = products.get(i);
      if (!productSet) continue;
      const mols = new MolArray();
      productSet.reset();
      while (!productSet.at_end()) {
        const jsMol = productSet.next();
        if (!jsMol) break;
        mols.push(new Mol(jsMol, this.#module));
      }
      productSet.delete();
      result.push(mols);
    }
    products.delete();

    return result;
  }

  // -- SVG --

  /**
   * Returns an SVG depiction of the reaction
   *
   * @param options - Drawing options including highlighting.
   *   When omitted, uses RDKit defaults.
   */
  getSvg(options?: Partial<RDKitRxnDepictionDetails>): string {
    const rxn = this.jsReaction;
    if (!options) return rxn.get_svg();
    return rxn.get_svg_with_highlights(JSON.stringify(options));
  }

  // -- Canvas drawing --

  /**
   * Draws the reaction to an HTML5 canvas with highlighting options
   * @param canvas - Target canvas element
   * @param options - Drawing options including dimensions and highlighting
   */
  drawToCanvas(canvas: HTMLCanvasElement, options: Partial<RDKitRxnDepictionDetails>): void {
    const rxn = this.jsReaction;
    if (!options) {
      rxn.draw_to_canvas(canvas, -1, -1);
    } else {
      rxn.draw_to_canvas_with_highlights(canvas, JSON.stringify(options));
    }
  }

  // -- Lifecycle --

  /**
   * Deletes the underlying C++ reaction object from memory.
   *
   * @see {@link https://emscripten.org/docs/porting/connecting_cpp_and_javascript/embind.html#memory-management | Emscripten docs}
   */
  delete(): void {
    this.#jsReaction?.delete();
    this.#jsReaction = null;
  }

  /** Disposable support — allows use with the `using` keyword */
  [Symbol.dispose](): void {
    this.delete();
  }
}
