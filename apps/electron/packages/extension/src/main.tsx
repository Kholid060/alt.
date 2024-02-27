import 'vite/modulepreload-polyfill';
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { ExtensionStateProvider } from './context/extension.context';
import AMessagePort from '#common/utils/AMessagePort';

const extComponents = import.meta.glob('../components/extension/*.tsx', {
  eager: true,
});
for (const key in extComponents) {
  const { name, default: component } = extComponents[key] as {
    name: string;
    default: React.FC;
  };
  if (!name || !component) continue;

  Object.defineProperty(window, name, {
    get() {
      return component;
    },
  });
}

function renderApp(messagePort: AMessagePort) {
  const extViewPath = './@view';
  const ExtensionView = lazy(() => import(/* @vite-ignore */ extViewPath));

  ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode>
      <ExtensionStateProvider messagePort={messagePort}>
        <Suspense>
          <ExtensionView />
        </Suspense>
      </ExtensionStateProvider>
    </React.StrictMode>,
  );
}

async function loadStyle(themeStyle: string) {
  try {
    const themeStyleEl = document.createElement('style');
    themeStyleEl.id = 'theme-style';
    themeStyleEl.textContent = themeStyle;
    document.head.appendChild(themeStyleEl);

    if (!import.meta.env.DEV) {
      const linkEl = document.createElement('link');
      linkEl.rel = 'stylesheet';
      linkEl.href = '@css';

      document.head.appendChild(linkEl);
      return;
    }

    const styleURL = '../@css';
    const styleModule = await import(/* @vite-ignore */ styleURL);

    const styleEl = document.createElement('style');
    styleEl.textContent = styleModule.default;

    document.head.appendChild(styleEl);
  } catch (error) {
    console.error(error);
  }
}

function onMessage({ ports, data }: MessageEvent) {
  const [messagePort] = ports;
  if (!messagePort) throw new Error('Message port empty');
  if (typeof data !== 'object' || data.type !== 'init' || !data.themeStyle)
    throw new Error('Invalid payload');

  loadStyle(data.themeStyle).finally(() => {
    renderApp(new AMessagePort(messagePort));
  });

  window.removeEventListener('message', onMessage);
}

window.addEventListener('message', onMessage);
