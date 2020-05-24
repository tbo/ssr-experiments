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
const CAMEL_CASE_PATTERN = new RegExp('[A-Z]*[a-z]+', 'g');

const toKebapCase = (value: string) => value.match(CAMEL_CASE_PATTERN)!.join('-');

const toString = (attribute: [string, any]) => {
  let [key, value] = attribute;
  if (key === 'className') {
    key = 'class';
  } else if (key === 'style') {
    value = Object.entries(value)
      .map((entry) => [toKebapCase(entry[0]), entry[1]].join(':'))
      .join(';');
  }
  return ` ${key.toLowerCase()}="${value}"`;
};

type Node = JSX.Element | Promise<Element | string> | Element | string;

export const render = async (root: Node, context?: any): Promise<string> => {
  const transform = (node: Node | Node[]): string | Promise<string> => {
    if (typeof node === 'string') {
      return node;
    } else if (node instanceof Promise) {
      return node.then(transform);
    } else if (Array.isArray(node)) {
      return Promise.all(node.map(transform)).then((children) => children.join(''));
    }
    const { type, props, children } = node as Element;
    if (typeof node.type === 'function') {
      if (!children) {
        return transform(node.type(node.props, context));
      }
      return (transform(children) as Promise<string>).then((children) =>
        transform(node.type(node.props ? { ...node.props, children } : { children }, context)),
      );
    }

    const propString = props ? Object.entries(props).map(toString).join('') : '';
    if (!children) {
      return `<${type}${propString}/>`;
    }
    return (transform(children) as Promise<string>).then((content) => `<${type}${propString}>${content}</${type}>`);
  };

  context.reply.header('content-type', 'text/html');
  return '<!DOCTYPE html>' + (await transform(root));
};
