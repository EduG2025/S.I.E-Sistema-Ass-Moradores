
/**
 * S.I.E PRO - AMBIENT TYPE DEFINITIONS
 * SRE Protocol: Resolve ts(2665), ts(7016), ts(7026)
 * FIX: Removed duplicate identifier declarations for React types that are already provided by @types/react.
 */

// FIX: Added export {} to mark this file as an external module. 
// TypeScript requires 'declare global' augmentations to be inside an external module or ambient declaration.
export {};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react-is';
declare module 'react-dom';
declare module 'react-dom/client';
declare module 'react/jsx-runtime';
