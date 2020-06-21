import { fibonacci } from '../wasm-html/pkg';

describe('Template tag', () => {
  test('simple', async () => {
    console.log(fibonacci(10));
  });
});
