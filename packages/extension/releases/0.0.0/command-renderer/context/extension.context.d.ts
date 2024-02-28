/// <reference types="react" />
import { AMessagePort } from '@repo/shared';
import { ExtensionMessagePortEvent } from '@/interfaces/message-events';
interface ExtensionContextState {
    query: string;
}
export declare const ExtensionContext: import("react").Context<ExtensionContextState>;
export declare function ExtensionProvider({ children, messagePort, value, }: {
    children: React.ReactNode;
    value?: string;
    messagePort: AMessagePort<ExtensionMessagePortEvent>;
}): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=extension.context.d.ts.map