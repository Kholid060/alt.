import type { ExtensionCommandRenderer } from '@repo/extension/dist/command-renderer/command-renderer';

const MODULE_MAP = {
  css: '../@css',
  react: '/@preload/react.js',
  renderer: '../@renderer',
  reactDOM: '/@preload/react-dom.js',
};

async function loadStyle(themeStyle: string) {
  try {
    const themeStyleEl = document.createElement('style');
    themeStyleEl.id = 'theme-style';
    themeStyleEl.textContent = themeStyle;
    document.head.appendChild(themeStyleEl);

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

async function renderApp(messagePort: MessagePort) {
  try {
    const { default: renderer } = (await import(MODULE_MAP.renderer)) as {
      default: ExtensionCommandRenderer;
    };

    const reactDOM = await import(MODULE_MAP.reactDOM);
    reactDOM.createRoot(document.querySelector('#app')!).render(
      renderer({
        messagePort,
      }),
    );
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
    renderApp(messagePort);
  });

  window.removeEventListener('message', onMessage);
}

window.addEventListener('message', onMessage);
