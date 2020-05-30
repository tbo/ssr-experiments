import { Readable, PassThrough } from 'stream';

(global as any).createElement = (
  type: any,
  props: Record<string, any> | undefined,
  ...children: any[]
): Promise<Element> | Element => ({
  type,
  props: props || {},
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
  if (value == null) {
    return '';
  } else if (key === 'className') {
    key = 'class';
  } else if (key === 'style') {
    value = Object.entries(value)
      .map((entry) => [toKebapCase(entry[0]), entry[1]].join(':'))
      .join(';')
      .toLowerCase();
  }
  return ` ${key.toLowerCase()}="${value}"`;
};

type Node = JSX.Element | Promise<Element | string> | Element | string;

type OutputEntry = string | Promise<Node>;

export const render = (RootComponent: (context: any) => Node, context?: any): Readable => {
  const outputQueue: OutputEntry[] = ['<!DOCTYPE html>'];
  const parseNode = (node: Node): OutputEntry[] => {
    if (typeof node === 'string') {
      return [node];
    } else if (typeof node === 'number') {
      return [String(node)];
    } else if (node instanceof Promise) {
      (node as Promise<Node>).then(parseNode).then((elements) => spliceNode(elements, outputQueue.indexOf(node)));
      return [node];
    } else if (Array.isArray(node)) {
      return node.flatMap(parseNode);
    }
    const { type, props, children } = node;
    if (typeof node.type === 'function') {
      if (!children) {
        return parseNode(node.type(node.props, context));
      }
      return parseNode(node.type({ ...node.props, children: (children as any).flatMap(parseNode) }, context));
    }
    const propString = props ? Object.entries(props).map(toString).join('') : '';
    if (!children) {
      return [`<${type}${propString}/>`];
    }
    return [`<${type}${propString}>`, ...(children as any).flatMap(parseNode), `</${type}>`];
  };
  const processQueue = () => {
    while (typeof outputQueue[0] === 'string') {
      sink.write(outputQueue[0]);
      outputQueue.shift();
    }
    if (outputQueue[0] instanceof Promise) {
      outputQueue[0].then(processQueue);
    } else {
      sink.end();
    }
  };
  const spliceNode = (elements: OutputEntry[], position: number) => {
    if (position !== -1) {
      outputQueue.splice(position, 1, ...elements);
    }
  };
  const sink = new PassThrough({});

  outputQueue.push(...parseNode(RootComponent(context)));
  processQueue();
  return sink;
};
