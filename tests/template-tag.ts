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

  test('Render simple template tag with number substitution', async () => {
    await expectJSXtoMatchSnapshot(() => html`test${42}`);
  });

  test('Render async template tag ', async () => {
    await expectJSXtoMatchSnapshot(async () => html`async test`);
  });

  test('Render embedded async string', async () => {
    await expectJSXtoMatchSnapshot(() => html`${Promise.resolve('async')} test`);
  });

  test('Render embedded async number', async () => {
    await expectJSXtoMatchSnapshot(() => html`async ${Promise.resolve(42)}`);
  });

  test('Render embedded template tag', async () => {
    await expectJSXtoMatchSnapshot(() => html`another ${html`template tag`}`);
  });

  test('Render embedded list', async () => {
    await expectJSXtoMatchSnapshot(() => html`another ${['Hello', '<b>World</b>']}`);
  });
  test('Render embedded async template tag', async () => {
    await expectJSXtoMatchSnapshot(() => html`another async ${Promise.resolve(html`template tag`)}`);
  });

  test('stream template tag', async () => {
    let trigger: any;
    let output = '';
    render(html`another async ${new Promise((resolve) => (trigger = resolve))}`).on('data', (data) => (output += data));
    await nextTick();
    expect(output).toMatchSnapshot();
    trigger();
    await nextTick();
    expect(output).toMatchSnapshot();
  });
});
