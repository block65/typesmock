/* eslint-disable no-underscore-dangle */
import { Module } from 'module';
import * as path from 'path';
import { pathToFileURL } from 'url';
import type { MockModule } from './global.js';
import { mockGet, mockModules, mockSet } from './mock-modules.js';
import { getIssuer, internalResolveKey, logger } from './shared.js';

// @ts-ignore
const defaultCommonJsLoader = Module._load;

function isBare(specifier: string) {
  return !specifier.startsWith('.') || specifier.includes(':');
}

export async function mockEsm(
  specifier: string,
  mockModule: MockModule,
): Promise<void> {
  const parentURL = getIssuer()?.toString();

  logger.log('mockEsm', {
    specifier,
    parentURL,
    bare: isBare(specifier),
  });

  // @ts-ignore - types/node doesn't include experimental node methods
  const resolvedActual = await import.meta.resolve(
    `${specifier}?${internalResolveKey}`,
    parentURL,
  );

  logger.log('mockEsm: resolved', {
    resolvedActual,
  });

  mockSet(
    resolvedActual,
    // if it's a bare specifier, we don't include the parent URL and it is mocked
    // everywhere, as the caller/issuer may be in a completely different file
    !isBare(specifier) ? parentURL : undefined,
    mockModule,
  );
}

function mergeCommonJsExports<T extends unknown>(
  mockModule: MockModule,
  moduleExports?: T,
): T {
  logger.log('mergeCommonJsExports', {
    mockModule,
    moduleExports,
  });

  // eslint-disable-next-line prefer-object-spread
  return Object.assign({}, mockModule.defaultExport, mockModule.namedExports);
  /*
  // if we nuked the default export ourselves
  if (mockModule.defaultExport instanceof Function) {
    // eslint-disable-next-line prefer-object-spread
    return Object.assign({}, mockModule.defaultExport, mockModule.namedExports);
  }

  // classes and functions
  if (moduleExports instanceof Function) {
    // eslint-disable-next-line prefer-object-spread
    return Object.assign(
      {},
      moduleExports,
      mockModule.defaultExport,
      mockModule.namedExports,
    );
  }
  // object like
  if (isPlainObject(moduleExports)) {
    return {
      // @ts-ignore
      ...moduleExports,
      ...mockModule.defaultExport,
      ...mockModule.namedExports,
    };
  }
  if (typeof moduleExports === 'undefined') {
    // eslint-disable-next-line prefer-object-spread
    return Object.assign({}, mockModule.defaultExport, mockModule.namedExports);
  }
  throw new Error('Cannot add mock exports to non-object'); */
}

function commonJsLoader(
  request: string,
  parent: NodeModule | undefined,
  isMain: boolean,
) {
  const parentURL = parent && pathToFileURL(parent.path).toString();
  const isAbsolute = path.isAbsolute(request);

  if (
    (Module.builtinModules.find((builtin) => request === builtin) ||
      isBare(request)) &&
    !isAbsolute
  ) {
    const [, mockModule] = mockGet(request, parentURL);

    logger.log('commonJsLoader:bare', {
      request,
      parentURL,
      mockModule,
    });

    return mockModule
      ? mergeCommonJsExports(mockModule)
      : defaultCommonJsLoader(request, parent, isMain);
  }

  const url = pathToFileURL(
    path.isAbsolute(request) ? request : path.resolve(request, parentURL || ''),
  ).toString();

  const [, mockModule] = mockGet(url, parentURL);

  logger.log('commonJsLoader', {
    request,
    url,
    parentURL,
    mockModule,
  });

  return mockModule
    ? mergeCommonJsExports(mockModule)
    : defaultCommonJsLoader(request, parent, isMain);
}

export async function mockCommonJs(
  specifier: string,
  mockModule: MockModule,
): Promise<void> {
  const parentURL = getIssuer()?.toString();

  // @ts-ignore
  Module._load = commonJsLoader;

  logger.log('mockEsm', {
    specifier,
    parentURL,
    bare: isBare(specifier),
  });

  // @ts-ignore - types/node doesn't include experimental node methods
  const resolvedActual = await import.meta.resolve(
    `${specifier}?${internalResolveKey}`,
    parentURL,
  );

  // const resolveCommonJs = createRequire(parentURL);
  // const resolvedActual = await resolveCommonJs(specifier);

  logger.log('mockEsm: resolved', {
    resolvedActual,
  });

  mockSet(
    resolvedActual,
    // if it's a bare specifier, we don't include the parent URL and it is mocked
    // everywhere, as the caller/issuer may be in a completely different file
    !isBare(specifier) ? parentURL : undefined,
    mockModule,
  );
}

export function mocksReset() {
  mockModules.clear();
}
