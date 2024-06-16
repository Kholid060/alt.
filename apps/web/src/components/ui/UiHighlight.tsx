import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { common, createLowlight } from 'lowlight';
import { memo } from 'react';
import '@/assets/css/hl-tokyo-night-dark.css';

const lowlight = createLowlight(common);

const UiHighlight = memo(
  ({ code, lang }: { code?: string; lang?: 'js' | 'json' }) => {
    if (!code) return null;

    const tree = lang
      ? lowlight.highlight(lang, code)
      : lowlight.highlightAuto(code);
    // @ts-expect-error ...
    const codeElement = toJsxRuntime(tree, { Fragment, jsx, jsxs });

    return codeElement;
  },
);
UiHighlight.displayName = 'UiHighlight';

export default UiHighlight;
