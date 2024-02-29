import react__default from 'react';
import { AMessagePort } from '@repo/shared';
import { ExtensionMessagePortEvent } from '../interfaces/message-events.js';

type ExtensionCommandView = () => react__default.ReactNode;
type ExtensionCommandRenderer = (detail: {
    messagePort: AMessagePort<ExtensionMessagePortEvent>;
}) => react__default.ReactNode;
declare function commandRenderer(CommandView: ExtensionCommandView): ExtensionCommandRenderer;

export { type ExtensionCommandRenderer, type ExtensionCommandView, commandRenderer as default };
