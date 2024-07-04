import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';
import { UiDialog, cn } from '@alt-dot/ui';
import { ExpandIcon } from 'lucide-react';
import { useState } from 'react';
import UiCodeEditor from '../../ui/UiCodeEditor';

const langs = {
  json: {
    title: 'JSON',
    module: json,
  },
  js: {
    title: 'JavaScript',
    module: javascript,
  },
};

interface WorkflowUiCodeEditorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  title?: string;
  readOnly?: boolean;
  placeholder?: string;
  hideHeader?: boolean;
  lang?: keyof typeof langs;
  onValueChange?(value: string): void;
}

function WorkflowUiCodeEditor({
  value,
  readOnly,
  className,
  lang = 'js',
  hideHeader,
  placeholder,
  title = 'Code',
  onValueChange,
  ...props
}: WorkflowUiCodeEditorProps) {
  const [expandEditor, setExpandEditor] = useState(false);

  const language = langs[lang];

  return (
    <div
      className={cn('overflow-hidden rounded-md border bg-card', className)}
      {...props}
    >
      {!hideHeader && (
        <div className="flex h-9 items-center border-b px-2">
          <p className="font-semibold">{title}</p>
          <span className="ml-1 text-xs text-muted-foreground">
            ({language.title})
          </span>
          <div className="flex-grow" />
          <UiDialog modal open={expandEditor} onOpenChange={setExpandEditor}>
            <UiDialog.Trigger asChild>
              <button className="h-full text-xs text-muted-foreground hover:underline">
                Expand
                <ExpandIcon className="ml-1 inline-block h-4 w-4" />
              </button>
            </UiDialog.Trigger>
            <UiDialog.Content className="max-w-2xl p-0">
              <UiDialog.Header className="px-4 pt-4">
                <UiDialog.Title>
                  {title}
                  <span className="ml-1.5 text-sm text-muted-foreground">
                    ({language.title})
                  </span>
                </UiDialog.Title>
              </UiDialog.Header>
              <UiCodeEditor
                value={value}
                readOnly={readOnly}
                className="min-h-72 border-t text-sm [&_.cm-gutters]:!bg-background"
                style={{ maxHeight: 'calc(100vh - 10rem)' }}
                placeholder={placeholder}
                extensions={[language.module()]}
                onChange={(value) => onValueChange?.(value)}
              />
            </UiDialog.Content>
          </UiDialog>
        </div>
      )}
      {!expandEditor && (
        <UiCodeEditor
          theme="dark"
          value={value}
          readOnly={readOnly}
          className="max-h-96 w-full overflow-auto text-xs [&_.cm-gutters]:!bg-card [&_.cm-scroller]:min-h-52"
          extensions={[language.module()]}
          onChange={(value) => onValueChange?.(value)}
          placeholder={placeholder || 'Your code here...'}
        />
      )}
    </div>
  );
}

export default WorkflowUiCodeEditor;
