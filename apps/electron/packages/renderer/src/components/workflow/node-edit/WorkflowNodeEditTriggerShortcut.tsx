import { WorkflowNodeTriggerShortcut } from '@altdot/workflow';
import { UiButton } from '@altdot/ui';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor/workflow-editor.store';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow';
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
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-destructive">
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
        <div className="mt-2 flex items-center">
          {shortcut ? (
            <div className="flex w-full items-center rounded-md border p-2">
              <UiShortcut
                shortcut={KeyboardShortcutUtils.toElectronShortcut(shortcut)}
                className="mr-1 text-sm"
              />
              <div className="flex-grow"></div>
              <button
                className="text-muted-foreground underline hover:text-foreground"
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
            <p className="w-full text-center text-muted-foreground">
              No keyboard shortcut
            </p>
          )}
        </div>
      )}
      <UiButton
        variant="secondary"
        size="sm"
        className="mt-6 w-full"
        onClick={() => setIsRecording(!isRecording)}
      >
        {!isRecording && <CircleDotIcon className="mr-2 h-4 w-4" />}
        {isRecording ? 'Cancel recording' : 'Record keyboard shortcut'}
      </UiButton>
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditTriggerShortcut.type = WORKFLOW_NODE_TYPE.DELAY;

export default WorkflowNodeEditTriggerShortcut;
