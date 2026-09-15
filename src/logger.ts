import type { RDKitModule, RDKitJSLog } from './types/rdkit-minimalib-typings';
import type {
  RDKitFailCallback,
  RDKitMolOperation,
  RDKitOperation,
  RDKitParseOperation,
} from './types/rdkit-esm.typings';

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
 * Error thrown when a computation on an existing molecule fails
 * (e.g. force-field minimization or conformer generation) and `throwOnError` is set.
 */
export class RDKitOperationError extends Error {
  readonly operation: RDKitMolOperation;
  /** SMILES of the molecule the operation was run on */
  readonly input: string;
  readonly rdkitMessage: string;

  constructor(operation: RDKitMolOperation, input: string, rdkitMessage: string) {
    super(`RDKit ${operation} failed for: ${input}${rdkitMessage ? `\n${rdkitMessage}` : ''}`);
    this.name = 'RDKitOperationError';
    this.operation = operation;
    this.input = input;
    this.rdkitMessage = rdkitMessage;
  }
}

/**
 * Type guard for RDKitOperationError.
 * @param error The error to check.
 * @returns True if the error is an instance of RDKitOperationError, false otherwise.
 * @example
 * ```ts
 * try {
 *   mol.minimize({ throwOnError: true });
 * } catch (e) {
 *   if (isRDKitOperationError(e)) {
 *     console.error(`${e.operation} failed:`, e.rdkitMessage);
 *   }
 * }
 * ```
 */
export const isRDKitOperationError = (error: unknown): error is RDKitOperationError => {
  return (
    error instanceof Error &&
    error.name === 'RDKitOperationError' &&
    'operation' in error &&
    'rdkitMessage' in error
  );
};

const PARSE_OPERATIONS: ReadonlySet<RDKitOperation> = new Set<RDKitParseOperation>([
  'getMol',
  'getQMol',
  'getRxn',
]);

const loggers = new WeakMap<RDKitModule, RDKitLogger>();

/**
 * Returns the logger created for a module by `RDKit`, if any.
 * Lets `Mol` report failures without holding a logger reference itself.
 * @internal
 */
export const getLogger = (mod: RDKitModule): RDKitLogger | undefined => loggers.get(mod);

/**
 * RDKitLogger manages RDKit error capture and dispatch to listeners, as well as optional console logging.
 */
export class RDKitLogger {
  private readonly mod: RDKitModule;
  private capture: RDKitJSLog | null = null;
  private callback: RDKitFailCallback | null = null;
  private enableLogging = false; // default: no console output
  private throwOnError = false; // set per-call via reset(), read by handleError()

  constructor(mod: RDKitModule) {
    this.mod = mod;
    loggers.set(mod, this);
  }

  private activate(): void {
    if (this.capture) return;
    const fn = this.enableLogging ? this.mod.set_log_tee : this.mod.set_log_capture;
    this.capture = fn('rdApp.error') ?? null;
  }

  /**
   * Called from configure({ enableLogging }). Switches between tee and capture
   * if already active; otherwise applies enable/disable_logging for the no-capture case.
   */
  setEnableLogging(enable: boolean): void {
    this.enableLogging = enable;
    if (this.capture) {
      this.capture.delete();
      this.capture = null;
      this.activate();
    } else {
      enable ? this.mod.enable_logging('rdApp.error') : this.mod.disable_logging('rdApp.error');
    }
  }

  /** Single callback slot — replaces any previous. Returns cleanup function. */
  addCallback(fn: RDKitFailCallback): () => void {
    this.callback = fn;
    this.activate();
    return () => {
      if (this.callback === fn) this.callback = null;
    };
  }

  /**
   * Call before each WASM operation that can fail.
   * Stores throwOnError state, activates capture if needed, clears the buffer.
   * Fast path: no-op when neither throwOnError nor capture is active.
   */
  reset(throwOnError: boolean): void {
    this.throwOnError = throwOnError;
    if (!throwOnError && !this.capture) return;
    if (throwOnError) this.activate();
    this.capture?.clear_buffer();
  }

  /**
   * Call on a failed WASM operation. Reads buffer, fires callback, throws if throwOnError:
   * `RDKitParseError` for parse operations, `RDKitOperationError` otherwise.
   * No-op when reset() took the fast path (capture still null).
   */
  handleError(input: string, operation: RDKitMolOperation): void;
  handleError(input: string | Uint8Array, operation: RDKitParseOperation): void;
  handleError(input: string | Uint8Array, operation: RDKitOperation): void {
    if (!this.capture) return;
    const message = this.capture.get_buffer().trim();
    this.capture.clear_buffer();
    this.callback?.({ input, message, operation });
    if (!this.throwOnError) return;
    if (PARSE_OPERATIONS.has(operation)) throw new RDKitParseError(input, message);
    throw new RDKitOperationError(operation as RDKitMolOperation, input as string, message);
  }
}
