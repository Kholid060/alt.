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
  lang?: keyof typeof langs;
  onValueChange?(value: string): void;
}

function WorkflowUiCodeEditor({
  value,
  className,
  lang = 'js',
  onValueChange,
  ...props
}: WorkflowUiCodeEditorProps) {
  const [expandEditor, setExpandEditor] = useState(false);

  const language = langs[lang];

  return (
    <div
      className={cn('rounded-lg overflow-hidden bg-card border', className)}
      {...props}
    >
      <div className="px-2 h-9 border-b flex items-center">
        <p className="font-semibold">Code</p>
        <span className="text-xs text-muted-foreground ml-1">
          ({language.title})
        </span>
        <div className="flex-grow" />
        <UiDialog open={expandEditor} onOpenChange={setExpandEditor}>
          <UiDialog.Trigger asChild>
            <button className="text-xs text-muted-foreground hover:underline h-full">
              Expand
              <ExpandIcon className="h-4 w-4 inline-block ml-1" />
            </button>
          </UiDialog.Trigger>
          <UiDialog.Content className="p-0 max-w-2xl">
            <UiDialog.Header className="px-4 pt-4">
              <UiDialog.Title>
                Code
                <span className="text-sm text-muted-foreground ml-1.5">
                  ({language.title})
                </span>
              </UiDialog.Title>
            </UiDialog.Header>
            <UiCodeEditor
              value={value}
              className="text-sm min-h-72 border-t"
              style={{ maxHeight: 'calc(100vh - 10rem)' }}
              placeholder="Your code here..."
              extensions={[language.module()]}
              onChange={(value) => onValueChange?.(value)}
            />
          </UiDialog.Content>
        </UiDialog>
      </div>
      {!expandEditor && (
        <UiCodeEditor
          theme="dark"
          value={value}
          className="text-xs max-h-96 [&_.cm-scroller]:min-h-52 overflow-auto"
          placeholder="Your code here..."
          extensions={[javascript()]}
          onChange={(value) => onValueChange?.(value)}
        />
      )}
    </div>
  );
}

export default WorkflowUiCodeEditor;
