import { useEffect, useRef, useState } from 'react';
import { useWorkflowEditor } from '/@/hooks/useWorkflowEditor';
import {
  UiContextMenu,
  UiContextMenuContent,
  UiContextMenuItem,
  UiContextMenuShortcut,
  UiContextMenuTrigger,
} from '@repo/ui';
import {
  WorkflowEditorOnEvent,
  WorkflowEditorContextMenuEventPayload,
  WorkflowEditorContextMenuType,
} from '/@/interface/workflow-editor.interface';
import UiShortcut from '../../ui/UiShortcut';

function ContextMenuItemBase({
  contextMenu,
}: {
  contextMenu: WorkflowEditorContextMenuEventPayload;
}) {
  const { event: workflowEditorEvent } = useWorkflowEditor();

  return (
    <>
      <UiContextMenuItem
        onClick={() =>
          workflowEditorEvent.emit(
            'node-list-modal:open',
            contextMenu?.position,
          )
        }
      >
        <p>Add node</p>
        <UiContextMenuShortcut>
          <UiShortcut shortcut="CmdOrCtrl+Shift+A" />
        </UiContextMenuShortcut>
      </UiContextMenuItem>
      <UiContextMenuItem>
        <p>Paste</p>
        <UiContextMenuShortcut>
          <UiShortcut shortcut="CmdOrCtrl+V" />
        </UiContextMenuShortcut>
      </UiContextMenuItem>
    </>
  );
}

function ContextMenuPane({
  contextMenu,
}: {
  contextMenu: Extract<
    WorkflowEditorContextMenuEventPayload,
    { type: WorkflowEditorContextMenuType.PANE }
  >;
}) {
  return (
    <>
      <ContextMenuItemBase contextMenu={contextMenu} />
    </>
  );
}

function ContextMenuNode({
  contextMenu,
}: {
  contextMenu: Extract<
    WorkflowEditorContextMenuEventPayload,
    { type: WorkflowEditorContextMenuType.NODE }
  >;
}) {
  return (
    <>
      <ContextMenuItemBase contextMenu={contextMenu} />
    </>
  );
}

function ContextMenuEdge({
  contextMenu,
}: {
  contextMenu: Extract<
    WorkflowEditorContextMenuEventPayload,
    { type: WorkflowEditorContextMenuType.EDGE }
  >;
}) {
  return (
    <>
      <ContextMenuItemBase contextMenu={contextMenu} />
    </>
  );
}

function WorkflowEditorContextMenu() {
  const { event: workflowEditorEvent } = useWorkflowEditor();

  const triggerRef = useRef<HTMLButtonElement>(null);

  const [contextMenu, setContextMenu] =
    useState<WorkflowEditorContextMenuEventPayload | null>(null);

  useEffect(() => {
    const onCloseContextMenu = () => {
      setContextMenu(null);
    };
    const onOpenContextMenu: WorkflowEditorOnEvent<'context-menu:open'> = (
      payload,
    ) => {
      if (!triggerRef.current) return;

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
      contextMenuContent = <ContextMenuPane contextMenu={contextMenu} />;
      break;
    case WorkflowEditorContextMenuType.NODE:
      contextMenuContent = <ContextMenuNode contextMenu={contextMenu} />;
      break;
    case WorkflowEditorContextMenuType.EDGE:
      contextMenuContent = <ContextMenuEdge contextMenu={contextMenu} />;
      break;
  }

  return (
    <UiContextMenu>
      <UiContextMenuTrigger
        ref={triggerRef}
        className="hidden"
      ></UiContextMenuTrigger>
      <UiContextMenuContent className="w-64">
        {contextMenuContent}
      </UiContextMenuContent>
    </UiContextMenu>
  );
}

export default WorkflowEditorContextMenu;
