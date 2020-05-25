declare module 'undici';
declare module 'diff-dom';
declare module 'nanomorph';
declare module 'ssestream2';
declare module 'fastify-error-page';

declare const createElement: (type: any, props?: any, ...children: any[]) => any;

interface Element<P = Record<string, any> | undefined, C = any> {
  type: ((props: P, context?: C) => Promise<Element<P, C> | string> | Element<P, C> | string) | string;
  props: P;
  children: (Element<P, C> | Promise<Element<P, C>>)[];
}

type ReturnElement<P> = Promise<Element<P>> | Element<P>;

interface Context {
  request: any;
}

declare namespace JSX {
  type Element = ReturnElement<any>;

  interface ElementChildrenAttribute {
    children: any;
  }

  interface IntrinsicAttributes {
    children: any;
  }

  interface IntrinsicElements {
    [name: string]: Record<string, any>;
  }
}
