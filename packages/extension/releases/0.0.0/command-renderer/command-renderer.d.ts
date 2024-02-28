import React from 'react';
export type ExtensionCommandView = () => React.ReactNode;
export type ExtensionCommandRenderer = (detail: {
    messagePort: MessagePort;
}) => React.ReactNode;
declare function commandRenderer(CommandView: ExtensionCommandView): ExtensionCommandRenderer;
export default commandRenderer;
//# sourceMappingURL=command-renderer.d.ts.map