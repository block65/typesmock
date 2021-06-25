import { URL } from 'url';

export const internalResolveKey = '__internalResolveRequest';
export const logger = {
  // log: console.info,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  log: (...args: any[]) => {},
};

// eslint-disable-next-line consistent-return
export function getIssuer(): URL | void {
  const oldPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const { stack } = new Error();
  Error.prepareStackTrace = oldPrepareStackTrace;

  if (Array.isArray(stack)) {
    // stack[0] holds this file
    // stack[1] holds where this function was called
    // stack[2] holds the file we're interested in
    const position = 2;
    return stack[position] ? stack[position].getFileName() : undefined;
  }
}
