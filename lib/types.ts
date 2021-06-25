declare global {
  namespace NodeJS {
    interface Global {
      _mockModules: Map<string, MockModule>;
    }
  }
}

type Format = 'builtin' | 'commonjs' | 'json' | 'module' | 'wasm';

export type MockModule = {
  namedExports?: Record<string, any>;
  defaultExport?: any;
};

export type ResolveHook = (
  specifier: string,
  context: {
    conditions: ('node' | 'import')[];
    parentURL?: string;
  },
  defaultResolve: ResolveHook,
) => Promise<{ url: string }>;

export type GetFormat = (
  url: string,
  context: {},
  defaultGetFormat: GetFormat,
) => Promise<{ format: Format }>;

export type GetSource = (
  url: string,
  context: { format: Format },
  defaultGetSource: GetSource,
) => Promise<{
  source: string | SharedArrayBuffer | Uint8Array;
}>;

export type TransformSource = (
  source: string | SharedArrayBuffer | Uint8Array,
  context: { format: Format; url: string },
  defaultTransformSource: TransformSource,
) => Promise<{
  source: string | SharedArrayBuffer | Uint8Array;
}>;

export interface Loader {
  resolve: ResolveHook;
  getFormat?: GetFormat;
  getSource?: GetSource;
  transformSource?: TransformSource;
  // getGlobalPreloadCode(): string;
}
