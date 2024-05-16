import { UiButton, UiKbd, UiTooltip } from '@repo/ui';
import {
  MaximizeIcon,
  MinusIcon,
  PlusIcon,
  RedoIcon,
  UndoIcon,
} from 'lucide-react';
import { useReactFlow, useStore } from 'reactflow';
import { useShallow } from 'zustand/react/shallow';
import { isInsideWorkflowEditor } from '../WorkflowEventListener';
import { useHotkeys } from 'react-hotkeys-hook';
import UiShortcut from '../../ui/UiShortcut';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor/workflow-editor.store';

function WorkflowEditorControls() {
  const { minZoomReached, maxZoomReached } = useStore(
    useShallow((state) => ({
      minZoomReached: state.transform[2] <= state.minZoom,
      maxZoomReached: state.transform[2] >= state.maxZoom,
    })),
  );
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  useHotkeys(
    ['mod+=', 'mod+minus', 'mod+0'],
    (event) => {
      if (!isInsideWorkflowEditor(event)) return;

      switch (event.key) {
        case '0':
          fitView({ duration: 250 });
          break;
        case '-':
          zoomOut({ duration: 100 });
          break;
        case '=':
          zoomIn({ duration: 100 });
          break;
      }
    },
    [zoomIn, zoomOut, fitView],
  );

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center border border-border/60 bg-secondary rounded-md">
        <UiTooltip
          label={
            <>
              Zoom out <UiShortcut shortcut="CmdOrCtrl+-" />
            </>
          }
          sideOffset={5}
        >
          <UiButton
            variant="ghost"
            size="icon"
            disabled={minZoomReached}
            onClick={() => zoomOut({ duration: 200 })}
          >
            <MinusIcon className="h-5 w-5" />
          </UiButton>
        </UiTooltip>
        <hr className="h-5 bg-border/60 w-px" />
        <UiTooltip
          label={
            <>
              Zoom in <UiShortcut shortcut="CmdOrCtrl" />
              <UiKbd>+</UiKbd>
            </>
          }
          sideOffset={5}
        >
          <UiButton
            variant="ghost"
            size="icon"
            disabled={maxZoomReached}
            onClick={() => zoomIn({ duration: 200 })}
          >
            <PlusIcon className="h-5 w-5" />
          </UiButton>
        </UiTooltip>
      </div>
      <UiTooltip
        label={
          <>
            Fit view <UiShortcut shortcut="CmdOrCtrl+0" />
          </>
        }
        sideOffset={5}
      >
        <UiButton
          variant="secondary"
          className="border border-border/60"
          size="icon"
          onClick={() => fitView({ duration: 500 })}
        >
          <MaximizeIcon className="h-5 w-5" />
        </UiButton>
      </UiTooltip>
    </div>
  );
}

export function WorkflowUndoRedo() {
  const { undo, redo, historyLen, historyIndex } = useWorkflowEditorStore(
    useShallow((state) => ({
      undo: state.undo,
      redo: state.redo,
      historyLen: state.history.length,
      historyIndex: state.historyIndex,
    })),
  );

  useHotkeys('mod+z', undo, []);
  useHotkeys('mod+shift+z', redo, []);

  return (
    <div className="border border-border/60 bg-secondary rounded-md">
      <UiTooltip
        label={
          <>
            Undo <UiShortcut shortcut="CmdOrCtrl+Z" />
          </>
        }
      >
        <UiButton
          variant="ghost"
          size="icon"
          disabled={historyIndex < 0}
          onClick={undo}
        >
          <UndoIcon className="h-5 w-5" />
        </UiButton>
      </UiTooltip>
      <hr className="h-5 bg-border/60 w-px inline-block" />
      <UiTooltip
        label={
          <>
            Redo <UiShortcut shortcut="CmdOrCtrl+Shift+Z" />
          </>
        }
      >
        <UiButton
          variant="ghost"
          size="icon"
          disabled={historyIndex >= historyLen - 1}
          className="ml-1"
          onClick={redo}
        >
          <RedoIcon className="h-5 w-5" />
        </UiButton>
      </UiTooltip>
    </div>
  );
}

export default WorkflowEditorControls;
