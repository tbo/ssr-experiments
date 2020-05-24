(global as any).createElement = (type: any, props: Record<string, any> | undefined, ...children: any[]): Element => ({
  type,
  props,
  children,
});

interface Element<P = Record<string, any> | undefined, C = any> {
  type: ((props: P, context?: C) => Promise<Element<P, C> | string> | Element<P, C> | string) | string;
  props: P;
  children: (Element<P, C> | Promise<Element<P, C>>)[];
}

const toString = (input: any) => {
  if (Array.isArray(input)) {
    return input.join(' ');
  } else if (input instanceof Object) {
    return Object.entries(input)
      .map((entry) => entry.join(':'))
      .join(';');
  }
  return input;
};

type Node = JSX.Element | Promise<Element | string> | Element | string;

export const render = (root: Node, context?: any): string | Promise<string> => {
  const transform = (node: Node): string | Promise<string> => {
    if (typeof node === 'string') {
      return node;
    } else if (node instanceof Promise) {
      return node.then(transform);
    } else if (typeof node.type === 'function') {
      return transform(node.type(node.props, context));
    }
    const { type, props, children } = node as Element;

    const propString = props
      ? Object.entries(props)
          .map(([key, value]) => ` ${key}="${toString(value)}"`)
          .join('')
      : '';
    if (!children) {
      return `<${type}${propString}/>`;
    }
    return Promise.all(children.map(transform)).then(
      (content) => `<${type}${propString}>${content.join('')}</${type}>`,
    );
  };
  return transform(root);
};
