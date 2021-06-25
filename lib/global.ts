export type MockModule = {
  namedExports?: Record<string, any>;
  defaultExport?: any;
};

declare global {
  namespace NodeJS {
    interface Global {
      _mockModules: Map<string, MockModule>;
    }
  }
}
