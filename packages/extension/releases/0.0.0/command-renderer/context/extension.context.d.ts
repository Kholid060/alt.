import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React$1 from 'react';
import { AMessagePort } from '@repo/shared';
import { ExtensionMessagePortEvent } from '../../interfaces/message-events.js';

interface ExtensionContextState {
    query: string;
}
declare const ExtensionContext: React$1.Context<ExtensionContextState>;
declare function ExtensionProvider({ children, messagePort, value, }: {
    children: React.ReactNode;
    value?: string;
    messagePort: AMessagePort<ExtensionMessagePortEvent>;
}): react_jsx_runtime.JSX.Element;

export { ExtensionContext, ExtensionProvider };
