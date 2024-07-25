import type { ExtensionCommandRenderer } from '@altdot/extension';
import { MODULE_MAP } from './constant';
import type { ExtensionRenderer } from '../interfaces/ext-renderer';
import type ReactDOM from 'react-dom/client';
import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import {
  ExtensionErrorBoundaryFallback,
  ExtensionErrorNotFound,
} from '../components/extension-errors';

async function loadStyle(themeStyle: string) {
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

async function getRenderer() {
  try {
    const { default: renderer } = (await import(MODULE_MAP.renderer)) as {
      default: ExtensionCommandRenderer;
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

  const renderer = await getRenderer();
  const reactDOM = (await import(MODULE_MAP.reactDOM)) as typeof ReactDOM;

  reactDOM.createRoot(document.querySelector('#app')!).render(
    <React.StrictMode>
      <ReactErrorBoundary
        FallbackComponent={(props) => (
          <ExtensionErrorBoundaryFallback {...{ ...props, messagePort }} />
        )}
      >
        {renderer ? (
          renderer({
            messagePort,
            context: launchContext,
          })
        ) : (
          <ExtensionErrorNotFound />
        )}
      </ReactErrorBoundary>
    </React.StrictMode>,
  );
};

export default extViewRenderer;
