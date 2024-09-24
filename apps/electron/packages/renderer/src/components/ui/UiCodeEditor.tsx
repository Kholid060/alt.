import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { tokyoNightInit } from '@uiw/codemirror-theme-tokyo-night';
import { forwardRef, useEffect, useRef } from 'react';
import { mergeRefs } from '/@/utils/helper';

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
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  useEffect(() => {
    const editor = editorRef.current?.view;

    return () => {
      editor?.destroy();
    };
  }, []);

  return (
    <CodeMirror
      theme="dark"
      placeholder="Your code here..."
      ref={mergeRefs(editorRef, ref)}
      extensions={[editorTheme, ...(extensions ?? [])]}
      {...props}
    />
  );
});
UiCodeEditor.displayName = 'UiCodeEditor';

export default UiCodeEditor;
