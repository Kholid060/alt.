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
import { useStore, useReactFlow } from 'reactflow';
import { useWorkflowStore } from '/@/stores/workflow-editor.store';
import preloadAPI from '/@/utils/preloadAPI';
import { APP_WORKFLOW_ELS_FORMAT } from '#packages/common/utils/constant/constant';
import { isIPCEventError } from '/@/utils/helper';

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
  const pasteElements = useWorkflowStore.use.pasteElements();

  const [show, setShow] = useState(false);

  useEffect(() => {
    preloadAPI.main
      .invokeIpcMessage('clipboard:has-buffer', APP_WORKFLOW_ELS_FORMAT)
      .then((hasValue) => {
        if (isIPCEventError(hasValue) || !hasValue) return;

        setShow(true);
      });
  }, []);

  if (!show) return null;

  return (
    <UiContextMenuItem onClick={pasteElements}>
      <p>Paste</p>
    </UiContextMenuItem>
  );
}

function ContextMenuItemCopy({
  nodeId,
  edgeId,
}: {
  nodeId?: string;
  edgeId?: string;
}) {
  const copyElements = useWorkflowStore.use.copyElements();

  return (
    <UiContextMenuItem onClick={() => copyElements({ edgeId, nodeId })}>
      <p>Copy</p>
    </UiContextMenuItem>
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
  const selection = useWorkflowStore.use.selection();

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
        Delete {selectedElsCount ? `(${selectedElsCount})` : ''}
      </p>
      <UiContextMenuShortcut>
        <UiShortcut shortcut="Backspace" />
      </UiContextMenuShortcut>
    </UiContextMenuItem>
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
          <UiShortcut shortcut="CmdOrCtrl+Shift+A" />
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
    </>
  );
}

function ContextMenuNode() {
  const contextMenu = useContextMenu<WorkflowEditorContextMenuType.NODE>();

  return (
    <>
      <ContextMenuItemCopy nodeId={contextMenu.nodeId} />
      <ContextMenuItemPaste />
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
      <UiContextMenuSeparator />
      <ContextMenuItemDelete edgeId={contextMenu.edgeId} />
    </>
  );
}

function ContextMenuSelection() {
  return (
    <>
      <ContextMenuItemAddNode />
      <ContextMenuItemCopy />
      <ContextMenuItemPaste />
      <UiContextMenuSeparator />
      <ContextMenuItemDelete />
    </>
  );
}

function WorkflowEditorContextMenu() {
  const { event: workflowEditorEvent } = useWorkflowEditor();
  const unselectNodesAndEdges = useStore(
    (state) => state.unselectNodesAndEdges,
  );

  const triggerRef = useRef<HTMLButtonElement>(null);

  const [contextMenu, setContextMenu] =
    useState<WorkflowEditorContextMenuEventPayload | null>(null);

  useEffect(() => {
    const clearSelection = (ctxData: WorkflowEditorContextMenuEventPayload) => {
      const { selection } = useWorkflowStore.getState();
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

      if (clearSelection) unselectNodesAndEdges();
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
