import { render } from '../src/server/jsx';
import { Readable } from 'stream';

const toString = async (stream: Readable) => {
  let buffer = '';
  stream.on('data', (data: string) => (buffer += data));
  return new Promise((resolve) => stream.on('end', () => resolve(buffer)));
};

const expectJSXtoMatchSnapshot = async (
  getComponent: () =>
    | JSX.Element
    | string
    | number
    | Array<JSX.Element | string | number>
    | Promise<JSX.Element | string | number | Array<JSX.Element | string | number>>,
) => expect(await toString(render(getComponent, {}))).toMatchSnapshot();

describe('JSX middleware', () => {
  test('Render simple jsx tag', async () => {
    await expectJSXtoMatchSnapshot(() => <div>simple component</div>);
  });

  test('Render attributes', async () => {
    await expectJSXtoMatchSnapshot(() => (
      <div id="test" style={{ padding: 3, textAlign: 'right' }} data-testid="testid">
        simple component
      </div>
    ));
  });

  test('Do not render empty attribute values', async () => {
    await expectJSXtoMatchSnapshot(() => <div id={undefined}>simple component</div>);
  });

  test('Render nested elements', async () => {
    await expectJSXtoMatchSnapshot(() => (
      <div>
        <span>nested component</span>
      </div>
    ));
  });

  test('Render multiple nested elements', async () => {
    await expectJSXtoMatchSnapshot(() => (
      <div>
        <span>first</span>
        second
        <span>
          <p>third</p>
        </span>
        fourth
      </div>
    ));
  });

  test('Render inline JavaScript', async () => {
    await expectJSXtoMatchSnapshot(() => (
      <ul>
        {['a', 'b', 'c'].map((content) => (
          <li key={content}>{content}</li>
        ))}
      </ul>
    ));
    await expectJSXtoMatchSnapshot(() => (
      <ul>
        {['a', 'b', 'c'].map(async (content) => (
          <li key={content}>{content}</li>
        ))}
      </ul>
    ));
  });

  test('Handle empty children', async () => {
    await expectJSXtoMatchSnapshot(() => <div>{null}</div>);
    await expectJSXtoMatchSnapshot(() => <div>{undefined}</div>);
    await expectJSXtoMatchSnapshot(() => <div />);
    // TODO Decide if these should be self-closing
    await expectJSXtoMatchSnapshot(() => <div>{Promise.resolve(null)}</div>);
    await expectJSXtoMatchSnapshot(() => <div>{Promise.resolve(undefined)}</div>);
  });

  test('Handle 0 as valid child', async () => {
    await expectJSXtoMatchSnapshot(() => <div>{0}</div>);
    await expectJSXtoMatchSnapshot(() => <div>{Promise.resolve(0)}</div>);
  });

  test('Handle atomic values', async () => {
    await expectJSXtoMatchSnapshot(() => 'only text');
    await expectJSXtoMatchSnapshot(() => 42);
    await expectJSXtoMatchSnapshot(() => undefined);
    await expectJSXtoMatchSnapshot(() => null);
    await expectJSXtoMatchSnapshot(() => Promise.resolve('only text'));
    await expectJSXtoMatchSnapshot(() => Promise.resolve(42));
    await expectJSXtoMatchSnapshot(() => Promise.resolve(undefined));
    await expectJSXtoMatchSnapshot(() => Promise.resolve(null));
  });

  test('Handle lists', async () => {
    await expectJSXtoMatchSnapshot(() => []);
    await expectJSXtoMatchSnapshot(() => [42, 'text', <p key="jsx">jsx</p>]);
    await expectJSXtoMatchSnapshot(() => Promise.resolve([]));
    await expectJSXtoMatchSnapshot(() => Promise.resolve([42, 'text', <p key="jsx">jsx</p>]));
  });

  test('Render custom components without properties', async () => {
    const Component = () => <span>custom component</span>;
    await expectJSXtoMatchSnapshot(() => (
      <div>
        <Component />
      </div>
    ));
    await expectJSXtoMatchSnapshot(() => <Component />);
  });

  test('Render custom components with properties', async () => {
    const Component = (props: { title: string; count: number }) => <span title={props.title}>{props.count}</span>;
    await expectJSXtoMatchSnapshot(() => (
      <div>
        <Component title="A nice title" count={42} />
      </div>
    ));
    await expectJSXtoMatchSnapshot(() => <Component title="Another title" count={0} />);
  });

  test('Render custom components with children', async () => {
    const Component = (props: { children: any }) => <span>{props.children}</span>;
    await expectJSXtoMatchSnapshot(() => (
      <div>
        <Component>Children</Component>
      </div>
    ));
    await expectJSXtoMatchSnapshot(() => (
      <Component>
        <b>A bold message</b>
      </Component>
    ));
    await expectJSXtoMatchSnapshot(() => <Component>{null}</Component>);
    await expectJSXtoMatchSnapshot(() => <Component>{42}</Component>);
  });
});
