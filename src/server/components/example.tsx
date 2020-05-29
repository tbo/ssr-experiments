const AnotherComponent = async () => {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return <span>Async string</span>;
};

const SomeComponent = async (props: { stuff: string; children: any }) => {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return (
    <p className="SomeComponent">
      <span>{props.stuff}</span>
      <div>{props.children}</div>
    </p>
  );
};

const Example = () => (
  <div id="abc" style={{ color: 'red', padding: 3 }}>
    <h1>JSX Example</h1>
    <p>some text</p>
    <SomeComponent stuff="123">
      <b>A bold message</b>
      <AnotherComponent>test</AnotherComponent>
    </SomeComponent>
  </div>
);

export default Example;
