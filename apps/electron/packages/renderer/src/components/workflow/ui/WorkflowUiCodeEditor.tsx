import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';
import { UiDialog, cn } from '@repo/ui';
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
      className={cn('rounded-md overflow-hidden bg-card border', className)}
      {...props}
    >
      {!hideHeader && (
        <div className="px-2 h-9 border-b flex items-center">
          <p className="font-semibold">{title}</p>
          <span className="text-xs text-muted-foreground ml-1">
            ({language.title})
          </span>
          <div className="flex-grow" />
          <UiDialog modal open={expandEditor} onOpenChange={setExpandEditor}>
            <UiDialog.Trigger asChild>
              <button className="text-xs text-muted-foreground hover:underline h-full">
                Expand
                <ExpandIcon className="h-4 w-4 inline-block ml-1" />
              </button>
            </UiDialog.Trigger>
            <UiDialog.Content className="p-0 max-w-2xl">
              <UiDialog.Header className="px-4 pt-4">
                <UiDialog.Title>
                  {title}
                  <span className="text-sm text-muted-foreground ml-1.5">
                    ({language.title})
                  </span>
                </UiDialog.Title>
              </UiDialog.Header>
              <UiCodeEditor
                value={value}
                readOnly={readOnly}
                className="text-sm min-h-72 border-t [&_.cm-gutters]:!bg-background"
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
          className="text-xs max-h-96 [&_.cm-scroller]:min-h-52 overflow-auto w-full [&_.cm-gutters]:!bg-card"
          extensions={[language.module()]}
          onChange={(value) => onValueChange?.(value)}
          placeholder={placeholder || 'Your code here...'}
        />
      )}
    </div>
  );
}

export default WorkflowUiCodeEditor;
