const SomeComponent = (props: { stuff: string; children: any }, context: any) => {
  console.log('some component', context);
  return <span>{props.stuff}</span>;
};

const Example = () => (
  <div id="abc" style={{ color: 'red', padding: 3 }}>
    <h1>JSX Example</h1>
    <p>some text</p>
    <SomeComponent stuff="abc">
      <b>A bold message</b>
    </SomeComponent>
  </div>
);

export default Example;
