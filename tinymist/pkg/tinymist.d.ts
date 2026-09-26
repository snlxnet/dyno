/* tslint:disable */
/* eslint-disable */

/**
 * The `ProxyContext` struct is a wrapper around a JavaScript this.
 */
export class ProxyContext {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Creates a new `ProxyContext` instance.
   */
  constructor(context: any);
  /**
   * A convenience function to untar a tarball and call a callback for each
   * entry.
   */
  untar(data: Uint8Array, cb: Function): void;
  /**
   * Returns the JavaScript this.
   */
  readonly context: any;
}

/**
 * TinymistLanguageServer implements the LSP protocol for Typst documents
 * in a WebAssembly environment
 */
export class TinymistLanguageServer {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Creates a new language server.
   */
  constructor(init_opts: any);
  /**
   * Handles internal events.
   */
  on_event(event_id: number): void;
  /**
   * Handles incoming notifications.
   */
  on_notification(method: string, js_params: any): void;
  /**
   * Handles incoming requests.
   */
  on_request(method: string, js_params: any): any;
  /**
   * Handles incoming responses.
   */
  on_response(js_result: any): void;
  /**
   * Get the version of the language server.
   */
  static version(): string;
}

/**
 * Gets the long version description of the library.
 */
export function version(): string;

export type InitInput =
  RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_tinymistlanguageserver_free: (a: number, b: number) => void;
  readonly tinymistlanguageserver_new: (a: any) => [number, number, number];
  readonly tinymistlanguageserver_on_event: (a: number, b: number) => void;
  readonly tinymistlanguageserver_on_notification: (
    a: number,
    b: number,
    c: number,
    d: any,
  ) => void;
  readonly tinymistlanguageserver_on_request: (
    a: number,
    b: number,
    c: number,
    d: any,
  ) => any;
  readonly tinymistlanguageserver_on_response: (a: number, b: any) => void;
  readonly tinymistlanguageserver_version: () => [number, number];
  readonly version: () => [number, number];
  readonly __wbg_proxycontext_free: (a: number, b: number) => void;
  readonly proxycontext_context: (a: number) => any;
  readonly proxycontext_untar: (
    a: number,
    b: number,
    c: number,
    d: any,
  ) => [number, number];
  readonly proxycontext_new: (a: any) => number;
  readonly wasm_bindgen__convert__closures_____invoke__h85918835668e5d09: (
    a: number,
    b: number,
    c: any,
  ) => [number, number];
  readonly wasm_bindgen__convert__closures_____invoke__h615c1ab295dfa67e: (
    a: number,
    b: number,
    c: any,
    d: any,
  ) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_destroy_closure: (a: number, b: number) => void;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(
  module: { module: SyncInitInput } | SyncInitInput,
): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init(
  module_or_path?:
    | { module_or_path: InitInput | Promise<InitInput> }
    | InitInput
    | Promise<InitInput>,
): Promise<InitOutput>;
