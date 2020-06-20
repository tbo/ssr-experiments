import { render, html } from '../benchmarks/streaming-template-tag/page';
import { Readable } from 'stream';

const toString = async (stream: Readable) => {
  let buffer = '';
  stream.on('data', (data: string) => (buffer += data));
  return new Promise((resolve) => stream.on('end', () => resolve(buffer)));
};

const nextTick = () => new Promise((resolve) => setImmediate(resolve));

const expectJSXtoMatchSnapshot = async (getComponent: () => any[] | Promise<any[]>) =>
  expect(await toString(render(getComponent()))).toMatchSnapshot();

describe('Template tag', () => {
  test('Render simple template tag', async () => {
    await expectJSXtoMatchSnapshot(() => html`test`);
  });
});
