import { html } from '../wasm-html/pkg';

describe('Template tag', () => {
  test('simple', async () => {
    console.log((html as any)`thomas ${123} test ${456}`);
  });
});
