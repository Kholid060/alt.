import {
  UiList,
  UiPopover,
  UiPopoverContent,
  UiPopoverTrigger,
  UiScrollArea,
  cn,
} from '@repo/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWorkflowEditor } from '/@/hooks/useWorkflowEditor';
import { useHotkeys } from 'react-hotkeys-hook';
import { PlugZapIcon, RepeatIcon, SearchIcon } from 'lucide-react';
import { UiListProvider } from '@repo/ui/dist/context/list.context';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import UiExtensionIcon from '../../ui/UiExtensionIcon';
import preloadAPI from '/@/utils/preloadAPI';
import { isIPCEventError } from '/@/utils/helper';
import { Connection, useReactFlow } from 'reactflow';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor.store';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import type {
  WorkflowEditorNodeGroup,
  WorkflowEditorNodeListItem,
  WorkflowEditorNodeListItems,
  WorkflowEditorOpenNodeListModalPayload,
} from '/@/interface/workflow-editor.interface';
import { nanoid } from 'nanoid/non-secure';
import { WorkflowNewNode } from '#packages/common/interface/workflow.interface';
import { WorkflowNodeBaseData } from '#packages/common/interface/workflow-nodes.interface';

type NodeCommandItem = WorkflowEditorNodeListItem<WORKFLOW_NODE_TYPE.COMMAND>;

const nodeTypes: (WorkflowEditorNodeGroup | 'All')[] = [
  'All',
  'Triggers',
  'Commands',
  'Scripts',
  'Flow',
];
const defaultData: WorkflowNodeBaseData = {
  $expData: {},
  isDisabled: false,
};

const triggerNodes: WorkflowEditorNodeListItems[] = [
  {
    icon: <UiList.Icon icon={PlugZapIcon} />,
    title: 'Manual Trigger',
    group: 'Triggers',
    value: 'trigger-manual',
    metadata: {
      type: 'manual',
      nodeType: WORKFLOW_NODE_TYPE.TRIGGER,
      ...defaultData,
    },
  },
];
const flowNodes: WorkflowEditorNodeListItems[] = [
  {
    group: 'Flow',
    title: 'Loop',
    value: 'loop-node',
    icon: <UiList.Icon icon={RepeatIcon} />,
    metadata: {
      varName: '',
      expression: '',
      dataSource: 'prev-node',
      nodeType: WORKFLOW_NODE_TYPE.LOOP,
      ...defaultData,
    },
  },
];

export function WorkflowEditorNodeList({
  className,
  onSelectItem,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  onSelectItem?: (node: WorkflowNewNode) => void;
}) {
  const extensionsQuery = useDatabaseQuery('database:get-extension-list', [
    true,
  ]);

  const [nodeType, setNodeType] = useState<WorkflowEditorNodeGroup | 'All'>(
    'All',
  );

  const commandItems = useMemo(() => {
    if (extensionsQuery.state !== 'idle') return [];

    const items: NodeCommandItem[] = [];

    extensionsQuery.data.forEach((extension) => {
      const extIcon = (
        <UiExtensionIcon
          alt={`${extension.title} icon`}
          id={extension.id}
          icon={extension.icon}
          iconWrapper={(icon) => <UiList.Icon icon={icon} />}
        />
      );

      extension.commands.forEach((command) => {
        if (command.type === 'view' || command.type === 'view:json') return;

        const item: NodeCommandItem = {
          group: command.type === 'script' ? 'Scripts' : 'Commands',
          metadata: {
            title: command.title,
            commandId: command.name,
            extension: {
              id: extension.id,
              title: extension.title,
              version: extension.version,
            },
            $expData: {},
            argsValue: {},
            isDisabled: false,
            args: command.arguments ?? [],
            nodeType: WORKFLOW_NODE_TYPE.COMMAND,
            icon: command.icon || extension.icon,
          },
          subtitle: extension.title,
          icon: command.icon ? (
            <UiExtensionIcon
              id={extension.id}
              alt={command.name}
              icon={command.icon}
              iconWrapper={(icon) => <UiList.Icon icon={icon} />}
            />
          ) : (
            extIcon
          ),
          title: command.title,
          value: extension.id + command.name,
        };

        items.push(item);
      });
    });

    return items;
  }, [extensionsQuery]);

  const items = ([] as WorkflowEditorNodeListItems[]).concat(
    triggerNodes,
    commandItems,
    flowNodes,
  );
  const filteredItems =
    nodeType === 'All'
      ? items
      : items.filter((item) => item.group === nodeType);

  function onItemSelected(value: string) {
    const selectedItem = items.find((item) => item.value === value);
    if (!selectedItem) return;

    const { nodeType, ...data } = selectedItem.metadata;
    onSelectItem?.({
      data,
      type: nodeType,
      position: { x: 0, y: 0 },
    } as WorkflowNewNode);
  }
  function onInputKeyDown({
    key,
    target: eventTarget,
  }: React.KeyboardEvent<HTMLInputElement>) {
    if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;

    const target = eventTarget as HTMLInputElement;
    const currentTypeIdx = nodeTypes.indexOf(nodeType);

    if (key === 'ArrowLeft' && target.selectionStart === 0) {
      setNodeType(
        nodeTypes.at(currentTypeIdx === 0 ? -1 : currentTypeIdx - 1)!,
      );
      return;
    }

    if (key === 'ArrowRight' && target.selectionEnd === 0) {
      setNodeType(
        nodeTypes.at(
          currentTypeIdx === nodeTypes.length - 1 ? 0 : currentTypeIdx + 1,
        )!,
      );
      return;
    }
  }

  return (
    <UiListProvider>
      <div className={cn('flex flex-col', className)} {...props}>
        <div className="border-b">
          <div className="flex items-center gap-2 px-3">
            <SearchIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <UiList.Input
              className="focus:outline-none h-11 bg-transparent flex-grow"
              placeholder="Search nodes..."
              onKeyDown={onInputKeyDown}
            />
          </div>
          <UiScrollArea orientation="horizontal">
            <div className="flex w-max text-muted-foreground">
              {nodeTypes.map((item) => (
                <button
                  key={item}
                  className={cn(
                    'border-b-2 px-2 pb-2 hover:text-foreground transition-colors min-w-12 shrink-0',
                    nodeType === item
                      ? 'border-primary text-foreground'
                      : 'border-transparent',
                  )}
                  onClick={() => setNodeType(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </UiScrollArea>
        </div>
        <UiList
          items={filteredItems}
          onItemSelected={onItemSelected}
          className="h-72 p-2 overflow-auto"
          renderItem={({ item, props, ref, selected }) => (
            <UiList.Item
              {...{ ...item, ...props, selected }}
              className="aria-selected:bg-secondary min-h-10"
              ref={ref}
            />
          )}
        />
      </div>
    </UiListProvider>
  );
}

export function WorkflowEditorNodeListModal() {
  const addNodes = useWorkflowEditorStore.use.addNodes();
  const addEdges = useWorkflowEditorStore.use.addEdges();

  const workflowEditor = useWorkflowEditor();
  const { screenToFlowPosition } = useReactFlow();

  const triggerRef = useRef<HTMLButtonElement>(null);
  const newNodeData = useRef<WorkflowEditorOpenNodeListModalPayload | null>(
    null,
  );

  const [show, setShow] = useState(false);

  const openModal = useCallback(
    async ({
      position,
      sourceEdge,
    }: Partial<WorkflowEditorOpenNodeListModalPayload> = {}) => {
      if (!triggerRef.current) return;

      let modalPosition = {
        x: 0,
        y: 0,
        ...(position ?? {}),
      };

      newNodeData.current = {
        position: { x: 0, y: 0 },
        sourceEdge: sourceEdge,
      };

      if (!position) {
        const cursorPosition = await preloadAPI.main.ipc.invoke(
          'screen:get-cursor-position',
          true,
        );
        if (isIPCEventError(cursorPosition)) return;

        modalPosition = screenToFlowPosition(cursorPosition);
        newNodeData.current.position = modalPosition;
      } else {
        newNodeData.current.position = screenToFlowPosition(modalPosition);
      }

      triggerRef.current.style.top = modalPosition.y + 'px';
      triggerRef.current.style.left = modalPosition.x + 'px';

      const clickEvent = new PointerEvent('click', {
        bubbles: true,
        clientX: modalPosition.x,
        clientY: modalPosition.y,
      });
      triggerRef.current.dispatchEvent(clickEvent);

      setShow(true);
    },
    [screenToFlowPosition],
  );

  useHotkeys(['mod+shift+a'], () => {
    openModal();
  });

  function onSelectItem(node: WorkflowNewNode) {
    if (!newNodeData.current) return;

    const { position, sourceEdge } = newNodeData.current;
    const newNode = {
      ...node,
      position,
    };

    const newEdges: Connection[] = [];
    const newNodes: WorkflowNewNode[] = [];

    if (sourceEdge) {
      newNode.id = nanoid();
      newEdges.push({
        targetHandle: '',
        target: newNode.id,
        source: sourceEdge.nodeId,
        sourceHandle: sourceEdge.handleId,
      });
    }

    if (node.type === WORKFLOW_NODE_TYPE.LOOP) {
      if (!newNode.id) newNode.id = nanoid();

      const nodeId = nanoid();

      newNodes.push({
        id: nodeId,
        type: WORKFLOW_NODE_TYPE.DO_NOTHING,
        position: {
          x: position.x + 250,
          y: position.y - 100,
        },
        data: { $expData: {}, isDisabled: false },
      });
      newEdges.push(
        {
          targetHandle: '',
          target: nodeId,
          source: newNode.id,
          sourceHandle: `start-loop:${newNode.id}`,
        },
        {
          targetHandle: '',
          source: nodeId,
          target: newNode.id,
          sourceHandle: `default:${nodeId}`,
        },
      );
    }

    addNodes([newNode, ...newNodes]);
    addEdges(newEdges);

    setShow(false);
  }

  useEffect(() => {
    workflowEditor.event.on('node-list-modal:open', openModal);

    return () => {
      workflowEditor.event.off('node-list-modal:open', openModal);
    };
  }, [workflowEditor.event, openModal]);

  return (
    <UiPopover open={show} onOpenChange={setShow} modal>
      <UiPopoverTrigger asChild>
        <button
          className="invisible pointer-events-none fixed"
          ref={triggerRef}
        ></button>
      </UiPopoverTrigger>
      <UiPopoverContent align="start" className="p-0 w-80 text-sm">
        <WorkflowEditorNodeList onSelectItem={onSelectItem} />
      </UiPopoverContent>
    </UiPopover>
  );
}
