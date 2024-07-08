import type { ExtensionCommandRenderer } from '@altdot/extension/dist/command-renderer/command-renderer';
import { MODULE_MAP } from './constant';
import type { ExtensionRenderer } from '../interfaces/ext-renderer';
import type ReactDOM from 'react-dom/client';
import React from 'react';
import type { FallbackProps } from 'react-error-boundary';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { mapStackTrace } from 'sourcemapped-stacktrace';
import type { BetterMessagePortSync } from '@altdot/shared';
import type { ExtensionMessagePortEvent } from '@altdot/extension/dist/interfaces/message-events';
import { UiButton } from '@altdot/ui';

async function loadStyle(themeStyle: string) {
  try {
    const themeStyleEl = document.createElement('style');
    themeStyleEl.id = 'theme-style';
    themeStyleEl.textContent = themeStyle;
    document.head.appendChild(themeStyleEl);

    const fontStyle = document.createElement('style');
    fontStyle.textContent = `
    @font-face {
      font-family: Inter;
      font-weight: 100 900;
      font-display: swap;
      font-style: normal;
      font-named-instance: "Regular";
      src: url("./@fonts/InterVariable.woff2") format("woff2");
    }
    `;
    document.head.appendChild(fontStyle);

    if (import.meta.env) {
      const { default: styleStr } = (await import(MODULE_MAP.css)) as {
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
  } catch (error) {
    console.error(error);
  }
}

function ErrorBoundaryFallback({
  error,
  messagePort,
}: FallbackProps & {
  messagePort: BetterMessagePortSync<ExtensionMessagePortEvent>;
}) {
  const [mappedStack, setMappedStack] = React.useState('');

  React.useEffect(() => {
    mapStackTrace(error.stack, (stackTrace) => {
      setMappedStack(
        error.stack.slice(0, error.stack.indexOf('\n')) +
          '\n' +
          stackTrace.join('\n'),
      );
    });
  }, [error]);

  return (
    <div className="h-full w-full p-4">
      <div className="flex items-start">
        <p className="flex-1 gap-4 font-semibold text-destructive-text">
          {error.message}
        </p>
        <UiButton
          size="sm"
          variant="secondary"
          onClick={() => messagePort.sendMessage('extension:reload')}
        >
          Reload
        </UiButton>
      </div>
      <div className="mt-4 whitespace-pre-wrap rounded-lg bg-card p-4 font-mono text-sm text-muted-foreground">
        {mappedStack}
      </div>
    </div>
  );
}

const extViewRenderer: ExtensionRenderer<[string]> = async (
  { messagePort, launchContext },
  theme,
) => {
  try {
    await loadStyle(theme);

    const { default: renderer } = (await import(MODULE_MAP.renderer)) as {
      default: ExtensionCommandRenderer;
    };

    const commandView = renderer({
      messagePort,
      context: launchContext,
    });

    const reactDOM = (await import(MODULE_MAP.reactDOM)) as typeof ReactDOM;
    reactDOM.createRoot(document.querySelector('#app')!).render(
      <React.StrictMode>
        <ReactErrorBoundary
          FallbackComponent={(props) => (
            <ErrorBoundaryFallback {...{ ...props, messagePort }} />
          )}
        >
          {commandView}
        </ReactErrorBoundary>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error(error);
  }
};

export default extViewRenderer;
