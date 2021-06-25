### TypeScript + ESM + mocking = typesmock

An experimental and unstable Typescript module loader, via
[ts-node](https://github.com/TypeStrong/ts-node), with ESM and CommonJS mocking.

Currently, testing for use with [AVA](https://github.com/avajs/ava). Does not
work with Jest.

Very heavily "inspired" by [quibble](https://github.com/testdouble/quibble)

#### AVA Example

```javascript
// ava.config.js

export default function factory() {
  return {
    //...
    extensions: {
      ts: 'module',
    },
    nodeArguments: [
      '--loader=@block65/typesmock/loader',
      '--experimental-import-meta-resolve',
    ],
  };
}
```

```typescript
// sum.ts
export function sum(a: number, b: number): number {
  return a + b;
}
```

```typescript
// test.ts

import test from 'ava';
import { mockEsm } from '@block65/typesmock';

test.before(async () => {
  await mockEsm('./sum.js', {
    namedExports: {
      sum() {
        return 5;
      },
    }
  });
});

test('Mathematics is fun', async (t) => {
  const { sum } = await import('./sum.js');
  t.is(sum(2, 2), 5); // true 💪
});

```
