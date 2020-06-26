import { html, render } from '../wasm-html/pkg';

describe('Template tag', () => {
  test('simple', async () => {
    console.log(render((html as any)`thomas ${(html as any)`another`} ${['1']} test ${456}`));
  });
});
