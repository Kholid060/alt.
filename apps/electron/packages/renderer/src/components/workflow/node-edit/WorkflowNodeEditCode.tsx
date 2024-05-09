import { WorkflowNodeCode } from '#packages/common/interface/workflow-nodes.interface';
import { UiDialog } from '@repo/ui';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor.store';
import { javascript } from '@codemirror/lang-javascript';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import { ExpandIcon } from 'lucide-react';
import { useState } from 'react';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import UiCodeEditor from '../../ui/UiCodeEditor';

function WorkflowNodeEditCode() {
  const node = useWorkflowEditorStore.use.editNode() as WorkflowNodeCode;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  const [expandEditor, setExpandEditor] = useState(false);

  return (
    <WorkflowNodeLayoutEdit node={node}>
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
              <UiCodeEditor
                value={node.data.jsCode}
                className="text-sm min-h-72 border-t"
                style={{ maxHeight: 'calc(100vh - 10rem)' }}
                placeholder="Your code here..."
                extensions={[javascript()]}
                onChange={(value) => updateEditNode({ jsCode: value })}
              />
            </UiDialog.Content>
          </UiDialog>
        </div>
        {!expandEditor && (
          <UiCodeEditor
            theme="dark"
            value={node.data.jsCode}
            className="text-xs max-h-96 [&_.cm-scroller]:min-h-52 overflow-auto"
            placeholder="Your code here..."
            extensions={[javascript()]}
            onChange={(value) => updateEditNode({ jsCode: value })}
          />
        )}
      </div>
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditCode.type = WORKFLOW_NODE_TYPE.CODE;

export default WorkflowNodeEditCode;
