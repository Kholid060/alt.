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
import { ExtensionProvider } from '../context/extension.context';

async function loadStyle(themeStyle: string) {
  const themeStyleEl = document.createElement('style');
  themeStyleEl.id = 'theme-style';
  themeStyleEl.textContent = themeStyle;
  document.head.appendChild(themeStyleEl);

  if (import.meta.env.DEV) {
    const cssPath = `.${MODULE_MAP.css}`;
    const { default: styleStr } = (await import(cssPath)) as {
      default: string;
    };
    const styleEl = document.createElement('style');
    styleEl.textContent = styleStr;

    document.head.appendChild(styleEl);
    return;
  }

  const linkEl = document.createElement('link');
  linkEl.rel = 'stylesheet';
  linkEl.href = MODULE_MAP.css;

  document.head.appendChild(linkEl);
}

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

const extViewRenderer: ExtensionRenderer<[string]> = async (
  { messagePort, launchContext },
  theme,
) => {
  await loadStyle(theme);

  const CommandView = await getView();
  const reactDOM = (await import(MODULE_MAP.reactDOM)) as typeof ReactDOM;

  reactDOM.createRoot(document.querySelector('#app')!).render(
    <React.StrictMode>
      <ReactErrorBoundary
        FallbackComponent={(props) => (
          <ExtensionErrorBoundaryFallback {...{ ...props, messagePort }} />
        )}
      >
        <UiListProvider>
          <UiTooltipProvider>
            <ExtensionProvider messagePort={messagePort}>
              {CommandView ? (
                <CommandView {...launchContext} />
              ) : (
                <ExtensionErrorNotFound />
              )}
            </ExtensionProvider>
          </UiTooltipProvider>
        </UiListProvider>
      </ReactErrorBoundary>
    </React.StrictMode>,
  );
};

export default extViewRenderer;
