/* eslint-disable no-underscore-dangle */
import { MockModule } from './global.js';
import { logger } from './shared.js';

global._mockModules = global._mockModules || new Map<string, MockModule>();

export const mockModules = global._mockModules;

function mockModuleId(
  specifier: string,
  parentURL?: string | undefined,
): string {
  return `${specifier}:${parentURL || 'any'}`;
  // mockModulesCounter += 1;
  // return mockModulesCounter.toString();
}

export function mockSet(
  url: string,
  parentURL: string | undefined,
  mockModule: MockModule,
): void {
  const id = mockModuleId(url, parentURL);
  logger.log('mockSet', {
    id,
  });
  mockModules.set(id, mockModule);
}

export function mockGet(
  url: string,
  parentURL?: string | undefined,
): [id: string, mockModule: MockModule | undefined] {
  const anyId = mockModuleId(url);
  const anyMockModule = mockModules.get(anyId);

  logger.log('mockGet:any', {
    specifier: url,
    parentURL,
    anyId,
    mockModule: !!anyMockModule,
  });

  if (anyMockModule) {
    return [anyId, anyMockModule];
  }

  const id = mockModuleId(url, parentURL);
  const mockModule = mockModules.get(id);

  logger.log('mockGet', {
    specifier: url,
    parentURL,
    id,
    mockModule: !!mockModule,
  });
  return [id, mockModule];
}
