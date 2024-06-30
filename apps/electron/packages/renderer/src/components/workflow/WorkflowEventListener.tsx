import { useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Viewport, useOnViewportChange } from 'reactflow';
import preloadAPI from '/@/utils/preloadAPI';
import { useHotkeys } from 'react-hotkeys-hook';
import { useWorkflowEditor } from '/@/hooks/useWorkflowEditor';
import { useWorkflowEditorStore } from '../../stores/workflow-editor/workflow-editor.store';

export const isInsideWorkflowEditor = (event: Event) =>
  event.target instanceof HTMLElement &&
  (event.target.classList.contains('react-flow') ||
    event.target.classList.toString().startsWith('react-flow'));

function WorkflowShortcutListener() {
  const { copyElements, selectAllNodes } = useWorkflowEditor();

  useHotkeys(
    'mod+a',
    (event) => {
      if (!isInsideWorkflowEditor(event)) return;

      event.preventDefault();
      selectAllNodes();
    },
    [],
  );
  useHotkeys(
    ['mod+c', 'mod+x'],
    (event) => {
      if (!isInsideWorkflowEditor(event)) return;

      const { edges, nodes } = useWorkflowEditorStore.getState().selection;
      if (edges.length === 0 && nodes.length === 0) return;

      copyElements({ edges, nodes }, event.key === 'x');
    },
    [],
  );

  return null;
}

function WokflowViewportChangesListener() {
  const { workflowId } = useParams();
  const viewportData = useRef<Viewport | null>(null);

  useOnViewportChange({
    onEnd: (viewport) => {
      viewportData.current = viewport;
    },
  });

  useEffect(() => {
    return () => {
      if (!workflowId || !viewportData.current) return;

      preloadAPI.main.ipc.invoke('database:update-workflow', workflowId, {
        viewport: viewportData.current,
      });
    };
  });

  return null;
}

function WorkflowEventListener() {
  return (
    <>
      <WorkflowShortcutListener />
      <WokflowViewportChangesListener />
    </>
  );
}

export default WorkflowEventListener;
