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

const nextTick = () => new Promise((resolve) => setImmediate(resolve));

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
    const AsyncComponent = async () => <span>async custom component</span>;
    await expectJSXtoMatchSnapshot(() => (
      <div>
        <AsyncComponent />
      </div>
    ));
    await expectJSXtoMatchSnapshot(() => <AsyncComponent />);
  });

  test('Render custom components with properties', async () => {
    const Component = (props: { title: string; count: number }) => <span title={props.title}>{props.count}</span>;
    await expectJSXtoMatchSnapshot(() => (
      <div>
        <Component title="A nice title" count={42} />
      </div>
    ));
    await expectJSXtoMatchSnapshot(() => <Component title="Another title" count={0} />);
    const AsyncComponent = async (props: { title: string; count: number }) => (
      <span title={props.title}>{props.count}</span>
    );
    await expectJSXtoMatchSnapshot(() => (
      <div>
        <AsyncComponent title="A nice title" count={42} />
      </div>
    ));
    await expectJSXtoMatchSnapshot(() => <AsyncComponent title="Another title" count={0} />);
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

  test('Trigger and stream components eagerly', async () => {
    const triggered = [];
    const getAsyncComponent = (id: string, Custom?: () => JSX.Element): [() => JSX.Element, () => Promise<void>] => {
      let resolvePromise: () => void;
      const signal = new Promise((resolve) => (resolvePromise = resolve));
      return [
        async () => {
          triggered.push(id);
          await signal;
          return Custom ? <Custom /> : <div>Leaf {id}</div>;
        },
        async () => {
          resolvePromise();
          await nextTick();
        },
      ];
    };
    const [LeafComponentA, triggerA] = getAsyncComponent('A');
    const [LeafComponentB, triggerB] = getAsyncComponent('B');
    const [LeafComponentD, triggerD] = getAsyncComponent('D');
    const [LeafComponentC, triggerC] = getAsyncComponent('C', () => (
      <div>
        <LeafComponentD />
      </div>
    ));

    const [LeafComponentE, triggerE] = getAsyncComponent('E');
    const [LeafComponentF, triggerF] = getAsyncComponent('F');

    const WrapperComponent = async (props: { children: any }) => <div>{props.children}</div>;

    const RootComponent = async () => (
      <div>
        <LeafComponentA />
        <WrapperComponent>
          <LeafComponentB />
          <LeafComponentC />
          <LeafComponentE />
        </WrapperComponent>
        <LeafComponentF />
      </div>
    );

    let output = '';
    const execute = () => render(RootComponent, {}).on('data', (data) => (output += data));

    // Trigger all components from top to bottom

    execute();
    await triggerA();
    expect(output).toMatchSnapshot();
    await triggerB();
    expect(output).toMatchSnapshot();
    await triggerC();
    expect(output).toMatchSnapshot();
    await triggerD();
    expect(output).toMatchSnapshot();
    await triggerE();
    expect(output).toMatchSnapshot();
    await triggerF();
    expect(output).toMatchSnapshot();

    // Every component should only be triggered once
    expect(triggered).toMatchObject(['A', 'B', 'C', 'E', 'F', 'D']);
  });

  test('Parallelize execution order', async () => {
    let output = '';
    const AnotherComponent = async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return <span>Async string</span>;
    };

    const SomeComponent = async (props: { stuff: string; children: any }) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return (
        <p className="SomeComponent">
          <span>{props.stuff}</span>
          <div>{props.children}</div>
        </p>
      );
    };

    const RootComponent = () => (
      <div id="abc" style={{ color: 'red', padding: 3 }}>
        <h1>JSX Example</h1>
        <p>some text</p>
        <SomeComponent stuff="123">
          <b>A bold message</b>
          <AnotherComponent>test</AnotherComponent>
        </SomeComponent>
      </div>
    );

    const stream = render(RootComponent, {});
    stream.on('data', (data) => (output += data));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(output).toMatchSnapshot();
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(output).toMatchSnapshot();
  });
});
