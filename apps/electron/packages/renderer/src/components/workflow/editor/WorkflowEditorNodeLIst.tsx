import {
  UiList,
  UiPopover,
  UiPopoverContent,
  UiPopoverTrigger,
  cn,
} from '@repo/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWorkflowEditor } from '/@/hooks/useWorkflowEditor';
import { useHotkeys } from 'react-hotkeys-hook';
import { PlugZapIcon, SearchIcon } from 'lucide-react';
import { UiListProvider } from '@repo/ui/dist/context/list.context';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import UiExtensionIcon from '../../ui/UiExtensionIcon';
import preloadAPI from '/@/utils/preloadAPI';
import { isIPCEventError } from '/@/utils/helper';
import { Connection, useReactFlow } from 'reactflow';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor.store';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import {
  WorkflowEditorNodeListCommandItem,
  WorkflowEditorNodeListItem,
  WorkflowEditorNodeListTriggerItem,
  WorkflowEditorOpenNodeListModalPayload,
} from '/@/interface/workflow-editor.interface';
import { nanoid } from 'nanoid/non-secure';
import { WorkflowNewNode } from '#packages/common/interface/workflow.interface';

type NodeType = 'all' | 'triggers' | 'commands' | 'scripts';

const nodeTypes: { id: NodeType; title: string }[] = [
  { id: 'all', title: 'All' },
  { id: 'triggers', title: 'Triggers' },
  { id: 'commands', title: 'Commands' },
  { id: 'scripts', title: 'Scripts' },
];

const triggersNode: WorkflowEditorNodeListTriggerItem[] = [
  {
    icon: <UiList.Icon icon={PlugZapIcon} />,
    title: 'Manual Trigger',
    group: 'Triggers',
    value: 'trigger-manual',
    metadata: { nodeType: WORKFLOW_NODE_TYPE.TRIGGER, type: 'manual' },
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

  const [nodeType, setNodeType] = useState<NodeType>('all');

  const items = useMemo(() => {
    const allItems: WorkflowEditorNodeListItem[] = [];

    extensionsQuery.data?.forEach((extension) => {
      const extIcon = (
        <UiExtensionIcon
          alt={`${extension.title} icon`}
          id={extension.id}
          icon={extension.icon}
          iconWrapper={(icon) => <UiList.Icon icon={icon} />}
        />
      );

      extension.commands.forEach((command) => {
        if (
          nodeType === 'triggers' ||
          command.type === 'view' ||
          command.type === 'view:json' ||
          (nodeType === 'scripts' && command.type !== 'script') ||
          (nodeType === 'commands' && command.type === 'script')
        )
          return;

        const item: WorkflowEditorNodeListCommandItem = {
          group: command.type === 'script' ? 'Scripts' : 'Commands',
          metadata: {
            title: command.title,
            commandId: command.name,
            extensionId: extension.id,
            extensionTitle: extension.title,
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

        allItems.push(item);
      });
    });

    if (nodeType === 'all' || nodeType === 'triggers') {
      allItems.unshift(...triggersNode);
    }

    return allItems;
  }, [extensionsQuery, nodeType]);

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

  return (
    <UiListProvider>
      <div className={cn('flex flex-col', className)} {...props}>
        <div className="border-b px-3">
          <div className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <UiList.Input
              className="focus:outline-none h-11 bg-transparent flex-grow"
              placeholder="Search nodes..."
            />
          </div>
          <div className="flex text-muted-foreground text-sm justify-between">
            {nodeTypes.map((item) => (
              <button
                key={item.id}
                className={cn(
                  'border-b-2 px-2 pb-2 hover:text-foreground transition-colors min-w-12',
                  nodeType === item.id
                    ? 'border-primary text-foreground'
                    : 'border-transparent',
                )}
                onClick={() => setNodeType(item.id)}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
        <UiList
          items={items}
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
        const cursorPosition = await preloadAPI.main.invokeIpcMessage(
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

    let nodeId: string | undefined;
    let newEdge: Connection | undefined;

    if (sourceEdge) {
      nodeId = nanoid();
      newEdge = {
        target: nodeId,
        targetHandle: '',
        source: sourceEdge.nodeId,
        sourceHandle: sourceEdge.handleId,
      };
    }

    addNodes([
      {
        ...node,
        position,
        id: nodeId,
      },
    ]);
    if (newEdge) addEdges([newEdge]);

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
