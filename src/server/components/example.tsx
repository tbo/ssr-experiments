const SomeComponent = (props: { stuff: string; children: any }) => {
  return (
    <p>
      <span>{props.stuff}</span>
      <div>{props.children}</div>
    </p>
  );
};

const Example = () => (
  <div id="abc" style={{ color: 'red', padding: 3 }}>
    <h1>JSX Example</h1>
    <p>some text</p>
    <SomeComponent stuff="abc123">
      <b>A bold message</b>
    </SomeComponent>
  </div>
);

export default Example;
