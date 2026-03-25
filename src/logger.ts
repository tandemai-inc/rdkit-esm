import type { RDKitModule, RDKitJSLog } from './types/rdkit-minimalib-typings';
import type { RDKitFailCallback, RDKitParseOperation } from './types/rdkit-esm.typings';

export class RDKitParseError extends Error {
  readonly input: string | Uint8Array;
  readonly rdkitMessage: string;

  constructor(input: string | Uint8Array, rdkitMessage: string) {
    const preview =
      input instanceof Uint8Array
        ? `<Uint8Array length=${input.length}>`
        : input.length > 80
          ? `${input.slice(0, 80)}…`
          : input;
    super(`RDKit failed to parse: ${preview}${rdkitMessage ? `\n${rdkitMessage}` : ''}`);
    this.name = 'RDKitParseError';
    this.input = input;
    this.rdkitMessage = rdkitMessage;
  }
}

/**
 * Type guard for RDKitParseError.
 * @param error The error to check.
 * @returns True if the error is an instance of RDKitParseError, false otherwise.
 * @example
 * ```ts
 * try {
 *   rdkit.getMol('invalid input', { throwOnError: true });
 * } catch (e) {
 *   if (isRDKitParseError(e)) {
 *     console.error('Parsing failed for input:', e.input);
 *     console.error('RDKit message:', e.rdkitMessage);
 *   } else {
 *     console.error('Unexpected error:', e);
 *   }
 * }
 * ```
 */
export const isRDKitParseError = (error: unknown): error is RDKitParseError => {
  return (
    error instanceof Error &&
    error.name === 'RDKitParseError' &&
    'input' in error &&
    'rdkitMessage' in error
  );
};

/**
 * RDKitLogger manages RDKit error capture and dispatch to listeners, as well as optional console logging.
 */
export class RDKitLogger {
  readonly #mod: RDKitModule;
  #capture: RDKitJSLog | null = null;
  #callback: RDKitFailCallback | null = null;
  #enableLogging = false; // default: no console output
  #throwOnError = false; // set per-call via reset(), read by handleError()

  constructor(mod: RDKitModule) {
    this.#mod = mod;
  }

  #activate(): void {
    if (this.#capture) return;
    const fn = this.#enableLogging ? this.#mod.set_log_tee : this.#mod.set_log_capture;
    this.#capture = fn('rdApp.error') ?? null;
  }

  /**
   * Called from configure({ enableLogging }). Switches between tee and capture
   * if already active; otherwise applies enable/disable_logging for the no-capture case.
   */
  setEnableLogging(enable: boolean): void {
    this.#enableLogging = enable;
    if (this.#capture) {
      this.#capture.delete();
      this.#capture = null;
      this.#activate();
    } else {
      enable ? this.#mod.enable_logging('rdApp.error') : this.#mod.disable_logging('rdApp.error');
    }
  }

  /** Single callback slot — replaces any previous. Returns cleanup function. */
  addCallback(fn: RDKitFailCallback): () => void {
    this.#callback = fn;
    this.#activate();
    return () => {
      if (this.#callback === fn) this.#callback = null;
    };
  }

  /**
   * Call before each WASM parse operation.
   * Stores throwOnError state, activates capture if needed, clears the buffer.
   * Fast path: no-op when neither throwOnError nor capture is active.
   */
  reset(throwOnError: boolean): void {
    this.#throwOnError = throwOnError;
    if (!throwOnError && !this.#capture) return;
    if (throwOnError) this.#activate();
    this.#capture?.clear_buffer();
  }

  /**
   * Call on null return from WASM. Reads buffer, fires callback, throws if throwOnError.
   * No-op when reset() took the fast path (capture still null).
   */
  handleError(input: string | Uint8Array, operation: RDKitParseOperation): void {
    if (!this.#capture) return;
    const message = this.#capture.get_buffer().trim();
    this.#capture.clear_buffer();
    this.#callback?.({ input, message, operation });
    if (this.#throwOnError) throw new RDKitParseError(input, message);
  }
}
