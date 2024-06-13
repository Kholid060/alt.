import { WorkflowNodeTriggerShortcut } from '#packages/common/interface/workflow-nodes.interface';
import { UiButton } from '@alt-dot/ui';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor/workflow-editor.store';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import UiShortcut from '../../ui/UiShortcut';
import { CircleDotIcon, Disc2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { KeyboardShortcutUtils } from '#common/utils/KeyboardShortcutUtils';

function WorkflowNodeEditTriggerShortcut() {
  const node =
    useWorkflowEditorStore.use.editNode() as WorkflowNodeTriggerShortcut;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  const [isRecording, setIsRecording] = useState(false);

  const { shortcut } = node.data;

  useEffect(() => {
    const shortcutRecorder = KeyboardShortcutUtils.createRecorder({
      onChange(value) {
        if (value.canceled) {
          setIsRecording(false);
          return;
        }

        updateEditNode<WorkflowNodeTriggerShortcut>({ shortcut: value.keys });
        setIsRecording(false);
      },
    });

    if (isRecording) {
      document.addEventListener('keydown', shortcutRecorder, true);
    } else {
      document.removeEventListener('keydown', shortcutRecorder, true);
    }

    return () => {
      document.removeEventListener('keydown', shortcutRecorder, true);
    };
  }, [isRecording]);

  return (
    <WorkflowNodeLayoutEdit node={node}>
      {isRecording ? (
        <>
          <span className="relative inline-block h-8 w-8">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full bg-destructive h-8 w-8 items-center justify-center">
              <Disc2Icon className="text-destructive-foreground/75" />
            </span>
          </span>
          <div className="mt-2">
            <p>Recording Hotkey</p>
            <p className="text-sm leading-tight text-muted-foreground">
              Press keys to use. Must include modifier key
            </p>
          </div>
        </>
      ) : (
        <div className="flex items-center mt-2">
          {shortcut ? (
            <div className="p-2 rounded-md border w-full flex items-center">
              <UiShortcut
                shortcut={KeyboardShortcutUtils.toElectronShortcut(shortcut)}
                className="text-sm mr-1"
              />
              <div className="flex-grow"></div>
              <button
                className="underline text-muted-foreground hover:text-foreground"
                onClick={() =>
                  updateEditNode<WorkflowNodeTriggerShortcut>({
                    shortcut: null,
                  })
                }
              >
                Remove
              </button>
            </div>
          ) : (
            <p className="text-center w-full text-muted-foreground">
              No keyboard shortcut
            </p>
          )}
        </div>
      )}
      <UiButton
        variant="secondary"
        size="sm"
        className="w-full mt-6"
        onClick={() => setIsRecording(!isRecording)}
      >
        {!isRecording && <CircleDotIcon className="h-4 w-4 mr-2" />}
        {isRecording ? 'Cancel recording' : 'Record keyboard shortcut'}
      </UiButton>
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditTriggerShortcut.type = WORKFLOW_NODE_TYPE.DELAY;

export default WorkflowNodeEditTriggerShortcut;
