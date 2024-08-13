import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProps,
  useStoreApi,
} from '@xyflow/react';
import {
  WORKFLOW_NODE_TYPE,
  WorkflowNodeBasicNode,
  WorkflowNodeLoopNode,
  WorkflowNodeCommandNode,
  WorkflowNodeConditionalNode,
  WorkflowEdgeDefault,
  WorkflowNodesProvider,
  WorkflowNodeNoteNode,
} from '@altdot/workflow';
import clsx from 'clsx';
import { BlocksIcon, LucideIcon } from 'lucide-react';
import { UiIcons } from '@altdot/ui';
import { forwardRef, memo, useEffect } from 'react';

const defaultNodeTypes = Object.values(WORKFLOW_NODE_TYPE).reduce<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Partial<Record<WORKFLOW_NODE_TYPE, React.FC<any>>>
>((acc, curr) => {
  acc[curr] = WorkflowNodeBasicNode;

  return acc;
}, {});
const nodeTypes: Partial<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Record<WORKFLOW_NODE_TYPE | 'default', React.FC<any>>
> = {
  ...defaultNodeTypes,
  default: WorkflowNodeBasicNode,
  [WORKFLOW_NODE_TYPE.LOOP]: WorkflowNodeLoopNode,
  [WORKFLOW_NODE_TYPE.NOTE]: WorkflowNodeNoteNode,
  [WORKFLOW_NODE_TYPE.COMMAND]: WorkflowNodeCommandNode,
  [WORKFLOW_NODE_TYPE.CONDITIONAL]: WorkflowNodeConditionalNode,
};
const edgeTypes = {
  default: WorkflowEdgeDefault,
};

const iconPrefix = 'icon:';
type CommandIconName = keyof typeof UiIcons;
function IconResolver({
  icon,
  iconWrapper,
}: {
  id: string;
  alt: string;
  icon: string;
  extensionIcon?: boolean;
  iconWrapper?: (icon: LucideIcon) => React.ReactNode;
}) {
  if (icon.startsWith(iconPrefix)) {
    let iconName = icon.slice(iconPrefix.length) as CommandIconName;
    iconName = UiIcons[iconName] ? iconName : 'Command';

    const Icon = UiIcons[iconName] ?? icon;
    if (iconWrapper) {
      return iconWrapper(Icon);
    }

    return <Icon />;
  }

  return (
    <span className="flex h-full w-full items-center justify-center">
      <BlocksIcon className="size-6" />
    </span>
  );
}

function FlowStoreConsumer() {
  const store = useStoreApi();

  useEffect(() => {
    store.setState({
      nodesDraggable: false,
      nodesConnectable: false,
      elementsSelectable: false,
    });
  }, [store]);

  return null;
}

const WorkflowViewer = memo(
  forwardRef<HTMLDivElement, ReactFlowProps>(
    ({ edges, nodes, className, ...props }, ref) => {
      return (
        <WorkflowNodesProvider
          extCommandChecker={() => ({
            cancel: () => {},
            result: Promise.resolve(true),
          })}
          hideToolbar
          resolveExtIcon={(node) => (
            <IconResolver
              id={node.id}
              alt={node.data.title}
              icon={node.data.icon}
            />
          )}
        >
          <ReactFlow
            ref={ref}
            nodes={nodes}
            tabIndex={-1}
            edges={edges}
            edgeTypes={edgeTypes}
            nodeTypes={nodeTypes}
            elevateNodesOnSelect
            className={clsx('focus:outline-none', className)}
            {...props}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={12}
              size={1}
              color="currentColor"
              className="text-foreground/15"
            />
            <FlowStoreConsumer />
            <Controls showInteractive={false} />
          </ReactFlow>
        </WorkflowNodesProvider>
      );
    },
  ),
);
WorkflowViewer.displayName = 'WorkflowViewer';

export default WorkflowViewer;
