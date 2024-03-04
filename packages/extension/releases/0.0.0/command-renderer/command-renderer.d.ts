import React__default from 'react';
import { AMessagePort } from '@repo/shared';
import { ExtensionMessagePortEvent } from '../interfaces/message-events.js';

type ExtensionCommandView = () => React__default.ReactNode;
type ExtensionCommandRenderer = (detail: {
    messagePort: AMessagePort<ExtensionMessagePortEvent>;
}) => React__default.ReactNode;
declare function commandRenderer(CommandView: ExtensionCommandView): ExtensionCommandRenderer;

export { type ExtensionCommandRenderer, type ExtensionCommandView, commandRenderer as default };
