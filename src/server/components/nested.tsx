const LeafComponentD = (): JSX.Element => {
  console.log('============================>');
  return 'Leaf D' as any;
};

const LeafComponentC = async () => {
  return <LeafComponentD />;
};

const WrapperComponent = (props: { children: any }) => props.children;

const Nested = () => (
  <WrapperComponent>
    <LeafComponentC />
  </WrapperComponent>
);

export default Nested;
