import type { CommandLaunchContext } from '@altdot/extension';
import { MODULE_MAP } from './constant';
import type { ExtensionRenderer } from '../interfaces/ext-renderer';
import type ReactDOM from 'react-dom/client';
import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import {
  ExtensionErrorBoundaryFallback,
  ExtensionErrorNotFound,
} from '../components/extension-errors';
import { UiListProvider } from '@altdot/ui/dist/context/list.context';
import { UiTooltipProvider } from '@altdot/ui/dist/components/ui/tooltip';
import ExtensionHistory from '../components/ExtensionHistory';
import ExtensionEventListener from '../components/ExtensionEventListener';

async function getView() {
  try {
    const { default: renderer } = (await import(MODULE_MAP.renderer)) as {
      default: React.FC<CommandLaunchContext>;
    };

    return renderer;
  } catch (error) {
    console.error(error);
    return null;
  }
}

const extViewRenderer: ExtensionRenderer = async ({
  messagePort,
  launchContext,
}) => {
  const [CommandView, reactDOM] = await Promise.all([
    getView(),
    (await import(MODULE_MAP.reactDOM)) as typeof ReactDOM,
  ]);

  const root = reactDOM.createRoot(document.querySelector('#app')!);
  root.render(
    <React.StrictMode>
      <ReactErrorBoundary
        FallbackComponent={(props) => (
          <ExtensionErrorBoundaryFallback {...{ ...props, messagePort }} />
        )}
      >
        <UiListProvider>
          <UiTooltipProvider>
            <ExtensionEventListener messagePort={messagePort} />
            {CommandView ? (
              <ExtensionHistory
                messagePort={messagePort}
                rootView={<CommandView {...launchContext} />}
              />
            ) : (
              <ExtensionErrorNotFound />
            )}
          </UiTooltipProvider>
        </UiListProvider>
      </ReactErrorBoundary>
    </React.StrictMode>,
  );

  window.addEventListener('unload', () => {
    root.unmount();
  });
};

export default extViewRenderer;
