import { render } from '../src/server/jsx';
import { Readable } from 'stream';

const toString = async (stream: Readable) => {
  let buffer = '';
  stream.on('data', (data: string) => (buffer += data));
  return new Promise((resolve) => stream.on('end', () => resolve(buffer)));
};

const expectJSXtoMatchSnapshot = async (getComponent: () => JSX.Element) =>
  expect(await toString(render(getComponent, {}))).toMatchSnapshot();

describe('JSX middleware', () => {
  test('Render simple jsx tag', () => expectJSXtoMatchSnapshot(() => <div>simple component</div>));

  test('Render attributes', () =>
    expectJSXtoMatchSnapshot(() => (
      <div id="test" style={{ padding: 3, textAlign: 'right' }}>
        simple component
      </div>
    )));

  test('Do not render empty attribute values', () =>
    expectJSXtoMatchSnapshot(() => <div id={undefined}>simple component</div>));
});
