import test from 'ava';
import { mockEsm } from '../lib/index.js';

test.before(async () => {
  await mockEsm('./ts-sum.js', {
    namedExports: {
      sum() {
        return 5;
      },
    },
  });
});

test('Check, sum. LOL', async (t) => {
  const { sum } = await import('./ts-sum.js');

  t.is(sum(2, 2), 5);
});
