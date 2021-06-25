/* eslint-disable no-underscore-dangle */
// @ts-ignore
// eslint-disable-next-line import/no-extraneous-dependencies
import * as tsNodeEsm from 'ts-node/esm.mjs';
import { URL } from 'url';
import type {
  GetFormat,
  GetSource,
  Loader,
  ResolveHook,
  TransformSource,
} from '../merge-loaders.js';
import type { MockModule } from './global.js';
import { mockGet } from './mock-modules.js';
import { internalResolveKey, logger } from './shared.js';

const useMockKey = '__useMock';

const tsModeHooks: Loader = tsNodeEsm;

// NOTE: These functions are written in typescript purely for DX, ie IDE
// completion and TS error checking
function getNamedExport(name: string, mockSpecifier: string) {
  return global._mockModules.get(mockSpecifier)?.namedExports?.[name];
}

function getDefaultExport(mockSpecifier: string) {
  return global._mockModules.get(mockSpecifier)?.defaultExport;
}

function mockToSource(
  { namedExports, defaultExport }: MockModule,
  mockSpecifier: string,
) {
  return [
    `const getNamedExport = ${getNamedExport.toString()}`,
    `const getDefaultExport = ${getDefaultExport.toString()}`,
    ...Object.keys(namedExports || {}).map((name) => {
      return `export var ${name} = getNamedExport(${JSON.stringify(
        name,
      )}, ${JSON.stringify(mockSpecifier)})`;
    }),
    ...(defaultExport
      ? [`export default getDefaultExport(${JSON.stringify(mockSpecifier)})`]
      : []),
  ].join(';\n\n');
}

/**
 * NOTES:
 * - This gets called even when the module is in the cache
 * - The return value is used as the cache key for the Node Module cache
 */
export const resolve: ResolveHook = async (
  specifier,
  context,
  defaultResolve,
) => {
  const skip = specifier.endsWith(`?${internalResolveKey}`);

  logger.log('resolve', {
    specifier,
    context,
    skip,
  });

  if (skip) {
    return tsModeHooks.resolve(
      specifier.replace(`?${internalResolveKey}`, ''),
      context,
      defaultResolve,
    );
  }

  // const defer = async () => defaultResolve(specifier, context, defaultResolve);

  const resolved = await tsModeHooks.resolve(
    specifier.replace(`?${internalResolveKey}`, ''),
    context,
    defaultResolve,
  );

  const [, mockModule] = mockGet(resolved.url, context.parentURL);

  logger.log('resolve:mockGet', {
    resolved,
    context,
    mockModule,
  });

  return {
    ...resolved,
    ...(mockModule && {
      url: `${resolved.url}?${useMockKey}=${context.parentURL}`,
    }),
  };
};

export const getFormat: GetFormat = async (url, context, defaultGetFormat) => {
  return (tsModeHooks.getFormat || defaultGetFormat)(
    url,
    context,
    defaultGetFormat,
  );
};

export const getSource: GetSource = async (url, context, defaultGetSource) => {
  const file = new URL(url);

  const useMockParentURL = file.searchParams.get('__useMock');

  logger.log('getSource', { url, context, useMockParentURL });

  // use the mock
  if (useMockParentURL) {
    file.searchParams.delete(useMockKey);

    const [mockSpecifier, mockModule] = mockGet(
      file.toString(),
      useMockParentURL,
    );

    if (mockModule) {
      const source = mockToSource(mockModule, mockSpecifier);
      logger.log('mockModule', {
        useMockParentURL,
        url,
        mockModule,
        source,
      });

      return {
        source,
      };
    }
  }
  return (tsModeHooks.getSource || defaultGetSource)(
    url,
    context,
    defaultGetSource,
  );
};

export const transformSource: TransformSource = async (
  source,
  context,
  defaultTransform,
) => {
  logger.log('transformSource', { source, context });

  const file = new URL(context.url);
  // dont transform mocked stuff
  if (file.searchParams.has('__useMock')) {
    return defaultTransform(source, context, defaultTransform);
  }

  return (tsModeHooks.transformSource || defaultTransform)(
    source,
    context,
    defaultTransform,
  );
};
