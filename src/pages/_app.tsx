// pages/_app.tsx
import React, { DetailedHTMLProps, HTMLAttributes, useEffect } from 'react';
import '@swisscom/sdx/dist/css/sdx.min.css';
import { JSX, defineCustomElements } from '@swisscom/sdx/dist/js/webcomponents/loader';
import { ComponentType } from 'react';

type AppProps = {
  Component: ComponentType<any>;
  pageProps: any;
};
import '../styles/globals.css';
import { CustomHeader } from '../components/Header/CustomHeader';

// Register the Stencil types
type StencilProps<T> = {
  [P in keyof T]?: Omit<T[P], 'ref'> | HTMLAttributes<T>;
};

// Register the React types
type ReactProps<T> = {
  [P in keyof T]?: DetailedHTMLProps<HTMLAttributes<T[P]>, T[P]>;
};

// Combine both types
type StencilToReact<T = JSX.IntrinsicElements, U = HTMLElementTagNameMap> = StencilProps<T> & ReactProps<U>;

// Export the new types as the new JSX namespace.
// Disable the eslint errors
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace React.JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends StencilToReact {}
  }
}

function App({ Component, pageProps }: AppProps): React.JSX.Element {
  useEffect(() => void defineCustomElements(), []);

  const { ...rest } = pageProps;

  return (
    <>
      <CustomHeader />
      <Component {...rest} />
    </>
  );
}

export default App;
