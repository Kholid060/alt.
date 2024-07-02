import CodeMirror from '@uiw/react-codemirror';
import { tokyoNightInit } from '@uiw/codemirror-theme-tokyo-night';
import { forwardRef } from 'react';

const editorTheme = tokyoNightInit({
  theme: 'dark',
  settings: {
    fontSize: 'inherit',
    fontFamily: 'var(--font-mono)',
    gutterBorder: 'rgb(var(--border))',
    background: 'inherit !important',
    gutterBackground: 'inherit !important',
  },
});

const UiCodeEditor = forwardRef<
  React.ComponentRef<typeof CodeMirror>,
  React.ComponentPropsWithoutRef<typeof CodeMirror>
>(({ extensions, ...props }, ref) => {
  return (
    <CodeMirror
      ref={ref}
      theme="dark"
      placeholder="Your code here..."
      extensions={[editorTheme, ...(extensions ?? [])]}
      {...props}
    />
  );
});
UiCodeEditor.displayName = 'UiCodeEditor';

export default UiCodeEditor;
