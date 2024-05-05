import { WorkflowNodeCode } from '#packages/common/interface/workflow-nodes.interface';
import {
  UiList,
  UiTabs,
  UiTabsList,
  UiTabsTrigger,
  UiTabsContent,
  UiDialog,
} from '@repo/ui';
import WorkflowNodeErrorHandler from './WorklflowNodeErrorHandler';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor.store';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { tokyoNightInit } from '@uiw/codemirror-theme-tokyo-night';
import { WORKFLOW_NODES } from '/@/utils/constant/workflow-nodes';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import { ExpandIcon } from 'lucide-react';
import { useState } from 'react';

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

function WorkflowNodeEditCode() {
  const { data } = useWorkflowEditorStore.use.editNode() as WorkflowNodeCode;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  const [expandEditor, setExpandEditor] = useState(false);

  const nodeData = WORKFLOW_NODES[WORKFLOW_NODE_TYPE.CODE];

  return (
    <>
      <div className="p-4 pb-2 flex items-center gap-2">
        <div className="h-10 w-10">
          <UiList.Icon icon={nodeData.icon} />
        </div>
        <div className="flex-grow">
          <p className="leading-tight">{nodeData.title} </p>
          <p className="text-sm text-muted-foreground">{nodeData.subtitle}</p>
        </div>
      </div>
      <UiTabs variant="line" defaultValue="parameters">
        <UiTabsList>
          <UiTabsTrigger value="parameters">Parameters</UiTabsTrigger>
          <UiTabsTrigger value="error">Error Handler</UiTabsTrigger>
        </UiTabsList>
        <UiTabsContent value="parameters" className="p-4 mt-0">
          <div className="rounded-lg overflow-hidden bg-card border">
            <div className="px-2 h-9 border-b flex justify-between items-center">
              <p className="font-semibold">Code</p>
              <UiDialog open={expandEditor} onOpenChange={setExpandEditor}>
                <UiDialog.Trigger asChild>
                  <button className="text-xs text-muted-foreground hover:underline h-full">
                    Expand
                    <ExpandIcon className="h-4 w-4 inline-block ml-1" />
                  </button>
                </UiDialog.Trigger>
                <UiDialog.Content className="p-0 max-w-2xl">
                  <UiDialog.Header className="px-4 pt-4">
                    <UiDialog.Title>Code</UiDialog.Title>
                  </UiDialog.Header>
                  <CodeMirror
                    theme="dark"
                    value={data.jsCode}
                    className="text-sm min-h-72 border-t"
                    style={{ maxHeight: 'calc(100vh - 10rem)' }}
                    placeholder="Your code here..."
                    extensions={[javascript(), editorTheme]}
                    onChange={(value) => updateEditNode({ jsCode: value })}
                  />
                </UiDialog.Content>
              </UiDialog>
            </div>
            {!expandEditor && (
              <CodeMirror
                theme="dark"
                value={data.jsCode}
                className="text-xs max-h-96 [&_.cm-scroller]:min-h-52 overflow-auto"
                placeholder="Your code here..."
                extensions={[javascript(), editorTheme]}
                onChange={(value) => updateEditNode({ jsCode: value })}
              />
            )}
          </div>
        </UiTabsContent>
        <UiTabsContent value="error" className="p-4 mt-0">
          <WorkflowNodeErrorHandler data={data.$errorHandler} />
        </UiTabsContent>
      </UiTabs>
    </>
  );
}

export const nodeType = WORKFLOW_NODE_TYPE.CODE;

export default WorkflowNodeEditCode;
