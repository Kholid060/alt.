import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useWorkflowEditor } from '/@/hooks/useWorkflowEditor';
import {
  UiContextMenu,
  UiContextMenuContent,
  UiContextMenuItem,
  UiContextMenuSeparator,
  UiContextMenuShortcut,
  UiContextMenuTrigger,
} from '@repo/ui';
import {
  WorkflowEditorOnEvent,
  WorkflowEditorContextMenuEventPayload,
  WorkflowEditorContextMenuType,
} from '/@/interface/workflow-editor.interface';
import UiShortcut from '../../ui/UiShortcut';
import { useReactFlow } from 'reactflow';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import preloadAPI from '/@/utils/preloadAPI';
import { WORKFLOW_ELEMENT_FORMAT } from '#packages/common/utils/constant/workflow.const';
import { isIPCEventError } from '/@/utils/helper';
import {
  WorkflowEdge,
  WorkflowElement,
} from '#packages/common/interface/workflow.interface';
import { WorkflowNodes } from '#packages/common/interface/workflow-nodes.interface';

const ContextMenuContext =
  // @ts-expect-error not default val is expected
  createContext<WorkflowEditorContextMenuEventPayload>();

const useContextMenu = <
  T extends WorkflowEditorContextMenuType = WorkflowEditorContextMenuType,
>() =>
  useContext(
    ContextMenuContext as unknown as React.Context<
      Extract<WorkflowEditorContextMenuEventPayload, { type: T }>
    >,
  );

function ContextMenuItemPaste() {
  const { pasteElements } = useWorkflowEditor();

  const [show, setShow] = useState(false);

  useEffect(() => {
    preloadAPI.main.ipc
      .invoke('clipboard:has-buffer', WORKFLOW_ELEMENT_FORMAT)
      .then((hasValue) => {
        if (isIPCEventError(hasValue) || !hasValue) return;

        setShow(true);
      });
  }, []);

  if (!show) return null;

  return (
    <UiContextMenuItem onClick={pasteElements}>
      <p>Paste</p>
      <UiContextMenuShortcut>
        <UiShortcut variant="text" shortcut="CmdOrCtrl+V" />
      </UiContextMenuShortcut>
    </UiContextMenuItem>
  );
}

function ContextMenuItemClipboard({
  nodeId,
  edgeId,
  copySelection,
}: {
  nodeId?: string;
  edgeId?: string;
  copySelection?: boolean;
}) {
  const { copyElements } = useWorkflowEditor();
  const { getEdge, getNode } = useReactFlow();

  function copy(cut?: boolean) {
    let element: WorkflowElement = { edges: [], nodes: [] };
    if (edgeId && !copySelection) {
      const edge = getEdge(edgeId);
      if (edge) element.edges.push(edge as WorkflowEdge);
    }
    if (nodeId && !copySelection) {
      const node = getNode(nodeId);
      if (node) element.nodes.push(node as WorkflowNodes);
    }

    if (copySelection) {
      const { selection } = useWorkflowEditorStore.getState();
      if (selection.nodes.length === 0) return;

      element = selection;
    }

    copyElements(element, cut);
  }

  return (
    <>
      <UiContextMenuItem onClick={() => copy()}>
        <p>Copy</p>
        <UiContextMenuShortcut>
          <UiShortcut variant="text" shortcut="CmdOrCtrl+C" />
        </UiContextMenuShortcut>
      </UiContextMenuItem>
      <UiContextMenuItem onClick={() => copy(true)}>
        <p>Cut</p>
        <UiContextMenuShortcut>
          <UiShortcut variant="text" shortcut="CmdOrCtrl+X" />
        </UiContextMenuShortcut>
      </UiContextMenuItem>
    </>
  );
}

function ContextMenuItemDelete({
  nodeId,
  edgeId,
}: {
  nodeId?: string;
  edgeId?: string;
}) {
  const { deleteElements } = useReactFlow();
  const selection = useWorkflowEditorStore.use.selection();

  const selectedElsCount = selection.edges.length + selection.nodes.length;

  function deleteWorkflowElements() {
    let nodeIds: { id: string }[] = [];
    let edgeIds: { id: string }[] = [];

    if (selection.nodes.length > 0) {
      nodeIds = selection.nodes.map((node) => ({ id: node.id }));
    } else if (nodeId) {
      nodeIds = [{ id: nodeId }];
    }

    if (selection.edges.length > 0) {
      edgeIds = selection.edges.map((node) => ({ id: node.id }));
    } else if (edgeId) {
      edgeIds = [{ id: edgeId }];
    }

    deleteElements({ nodes: nodeIds, edges: edgeIds });
  }

  return (
    <UiContextMenuItem
      className="data-[highlighted]:bg-destructive/10"
      onClick={deleteWorkflowElements}
    >
      <p className="text-destructive-text">
        Delete {selectedElsCount > 1 ? `(${selectedElsCount})` : ''}
      </p>
      <UiContextMenuShortcut>
        <UiShortcut variant="text" shortcut="Backspace" />
      </UiContextMenuShortcut>
    </UiContextMenuItem>
  );
}

function ContextMenuItemSelection() {
  const { unselectAll, selectAllNodes } = useWorkflowEditor();

  return (
    <>
      <UiContextMenuSeparator />
      <UiContextMenuItem onClick={() => selectAllNodes()}>
        <p>Select all</p>
        <UiContextMenuShortcut>
          <UiShortcut variant="text" shortcut="CmdOrCtrl+A" />
        </UiContextMenuShortcut>
      </UiContextMenuItem>
      <UiContextMenuItem onClick={() => unselectAll()}>
        Clear selection
      </UiContextMenuItem>
    </>
  );
}

function ContextMenuItemAddNode() {
  const contextMenu = useContextMenu();
  const { event: workflowEditorEvent } = useWorkflowEditor();

  return (
    <>
      <UiContextMenuItem
        onClick={() =>
          workflowEditorEvent.emit('node-list-modal:open', {
            position: contextMenu.position,
          })
        }
      >
        <p>Add node</p>
        <UiContextMenuShortcut>
          <UiShortcut variant="text" shortcut="Shift+A" />
        </UiContextMenuShortcut>
      </UiContextMenuItem>
    </>
  );
}

function ContextMenuPane() {
  return (
    <>
      <ContextMenuItemAddNode />
      <ContextMenuItemPaste />
      <ContextMenuItemSelection />
    </>
  );
}

function ContextMenuNode() {
  const { runCurrentWorkflow } = useWorkflowEditor();
  const setEditNode = useWorkflowEditorStore.use.setEditNode();

  const contextMenu = useContextMenu<WorkflowEditorContextMenuType.NODE>();

  function editCurrentNode() {
    const { workflow } = useWorkflowEditorStore.getState();
    if (!workflow) return;

    const node = workflow.nodes.find((item) => item.id === contextMenu.nodeId);
    if (!node) return;

    setEditNode(node);
  }
  function copyNodeId() {
    preloadAPI.main.ipc.invoke('clipboard:copy', contextMenu.nodeId);
  }

  return (
    <>
      <UiContextMenuItem onClick={editCurrentNode}>Edit</UiContextMenuItem>
      <UiContextMenuItem onClick={() => runCurrentWorkflow(contextMenu.nodeId)}>
        Run workflow from here
      </UiContextMenuItem>
      <UiContextMenuSeparator />
      <UiContextMenuItem onClick={copyNodeId}>Copy node id</UiContextMenuItem>
      <ContextMenuItemClipboard nodeId={contextMenu.nodeId} />
      <ContextMenuItemPaste />
      <ContextMenuItemSelection />
      <UiContextMenuSeparator />
      <ContextMenuItemDelete nodeId={contextMenu.nodeId} />
    </>
  );
}

function ContextMenuEdge() {
  const contextMenu = useContextMenu<WorkflowEditorContextMenuType.EDGE>();

  return (
    <>
      <ContextMenuItemAddNode />
      <ContextMenuItemPaste />
      <ContextMenuItemSelection />
      <ContextMenuItemDelete edgeId={contextMenu.edgeId} />
    </>
  );
}

function ContextMenuSelection() {
  return (
    <>
      <ContextMenuItemAddNode />
      <ContextMenuItemClipboard copySelection />
      <ContextMenuItemPaste />
      <ContextMenuItemSelection />
      <UiContextMenuSeparator />
      <ContextMenuItemDelete />
    </>
  );
}

function WorkflowEditorContextMenu() {
  const { event: workflowEditorEvent, unselectAll } = useWorkflowEditor();

  const triggerRef = useRef<HTMLButtonElement>(null);

  const [contextMenu, setContextMenu] =
    useState<WorkflowEditorContextMenuEventPayload | null>(null);

  useEffect(() => {
    const clearSelection = (ctxData: WorkflowEditorContextMenuEventPayload) => {
      const { selection } = useWorkflowEditorStore.getState();
      let clearSelection =
        selection.edges.length > 0 || selection.nodes.length > 0;

      switch (ctxData.type) {
        case WorkflowEditorContextMenuType.EDGE: {
          clearSelection = !selection.edges.some(
            (edge) => edge.id === ctxData.edgeId,
          );
          break;
        }
        case WorkflowEditorContextMenuType.NODE: {
          clearSelection = !selection.nodes.some(
            (node) => node.id === ctxData.nodeId,
          );
          break;
        }
        case WorkflowEditorContextMenuType.SELECTION:
          clearSelection = false;
          break;
      }

      if (clearSelection) unselectAll();
    };

    const onCloseContextMenu = () => {
      setContextMenu(null);
    };
    const onOpenContextMenu: WorkflowEditorOnEvent<'context-menu:open'> = (
      payload,
    ) => {
      if (!triggerRef.current) return;

      clearSelection(payload);
      setContextMenu(payload);

      triggerRef.current.dispatchEvent(
        new PointerEvent('contextmenu', {
          bubbles: true,
          clientX: payload.position.x,
          clientY: payload.position.y,
        }),
      );
    };

    workflowEditorEvent.on('context-menu:open', onOpenContextMenu);
    workflowEditorEvent.on('context-menu:close', onCloseContextMenu);

    return () => {
      workflowEditorEvent.off('context-menu:open', onOpenContextMenu);
      workflowEditorEvent.off('context-menu:close', onCloseContextMenu);
    };
  }, [workflowEditorEvent]);

  let contextMenuContent: React.ReactNode = null;
  switch (contextMenu?.type) {
    case WorkflowEditorContextMenuType.PANE:
      contextMenuContent = <ContextMenuPane />;
      break;
    case WorkflowEditorContextMenuType.NODE:
      contextMenuContent = <ContextMenuNode />;
      break;
    case WorkflowEditorContextMenuType.EDGE:
      contextMenuContent = <ContextMenuEdge />;
      break;
    case WorkflowEditorContextMenuType.SELECTION:
      contextMenuContent = <ContextMenuSelection />;
      break;
  }

  return (
    <UiContextMenu>
      <UiContextMenuTrigger
        ref={triggerRef}
        className="hidden"
      ></UiContextMenuTrigger>
      <UiContextMenuContent className="w-64">
        {contextMenu && (
          <ContextMenuContext.Provider value={contextMenu}>
            {contextMenuContent}
          </ContextMenuContext.Provider>
        )}
      </UiContextMenuContent>
    </UiContextMenu>
  );
}

export default WorkflowEditorContextMenu;
