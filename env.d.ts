
/**
 * S.I.E PRO - AMBIENT TYPE DEFINITIONS
 * SRE Protocol: Resolve ts(2665), ts(7016), ts(7026)
 */

declare module 'react' {
  export type ReactNode = any;
  export type FC<P = {}> = any;
  export type FormEvent<T = any> = any;
  export type ChangeEvent<T = any> = any;
  export type ReactElement = any;
  export function useState<S>(initialState: S | (() => S)): [S, (newState: S | ((prevState: S) => S)) => void];
  export function useEffect(effect: () => any, deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps: any[] | undefined): T;
  export function useCallback<T>(callback: T, deps: any[]): T;
  export function useRef<T>(initialValue?: T): { current: T };
  export function lazy<T>(factory: () => Promise<{ default: T }>): T;
  export function Suspense(props: any): any;
  export function createElement(type: any, props?: any, ...children: any[]): any;
  export class Component<P = any, S = any> {
    constructor(props: P);
    props: P;
    state: S;
    render(): any;
    static getDerivedStateFromError?(error: any): any;
    componentDidCatch?(error: any, info: any): void;
  }
  const React: any;
  export default React;
}

declare module 'react-dom';
declare module 'react-dom/client';
declare module 'react/jsx-runtime';

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
