import type { ExtensionCommandRenderer } from '@repo/extension/dist/command-renderer/command-renderer';
import { MODULE_MAP } from './constant';
import type { ExtensionRenderer } from '../interfaces/ext-renderer';
import type ReactDOM from 'react-dom/client';

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

const extViewRenderer: ExtensionRenderer<[string]> = async (
  { messagePort, launchContext },
  theme,
) => {
  try {
    await loadStyle(theme);

    const { default: renderer } = (await import(MODULE_MAP.renderer)) as {
      default: ExtensionCommandRenderer;
    };

    const reactDOM = (await import(MODULE_MAP.reactDOM)) as typeof ReactDOM;
    reactDOM.createRoot(document.querySelector('#app')!).render(
      renderer({
        messagePort,
        context: launchContext,
      }),
    );
  } catch (error) {
    console.error(error);
  }
};

export default extViewRenderer;
