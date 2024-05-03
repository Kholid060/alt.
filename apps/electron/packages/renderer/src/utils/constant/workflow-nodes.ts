import {
  WorkflowNodeHandleSource,
  WorkflowNodeHandleTarget,
} from '#packages/common/interface/workflow-nodes.interface';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import {
  CircleSlash2Icon,
  CommandIcon,
  LucideIcon,
  PlugZapIcon,
  RepeatIcon,
} from 'lucide-react';

export const WORKFLOW_NODES: {
  [T in WORKFLOW_NODE_TYPE]: {
    type: T;
    title: string;
    icon: LucideIcon;
    subtitle?: string;
    handleTarget: WorkflowNodeHandleTarget[];
    handleSource: WorkflowNodeHandleSource[];
  };
} = {
  [WORKFLOW_NODE_TYPE.COMMAND]: {
    title: 'Command',
    icon: CommandIcon,
    subtitle: 'Command',
    handleSource: [], // no need, has its own node component
    handleTarget: [],
    type: WORKFLOW_NODE_TYPE.COMMAND,
  },
  [WORKFLOW_NODE_TYPE.DO_NOTHING]: {
    title: 'Do Nothing',
    icon: CircleSlash2Icon,
    handleTarget: ['default'],
    handleSource: ['default'],
    type: WORKFLOW_NODE_TYPE.DO_NOTHING,
  },
  [WORKFLOW_NODE_TYPE.LOOP]: {
    title: 'Looping',
    icon: RepeatIcon,
    subtitle: 'Control Flow',
    type: WORKFLOW_NODE_TYPE.LOOP,
    handleTarget: [],
    handleSource: [],
  },
  [WORKFLOW_NODE_TYPE.TRIGGER]: {
    icon: PlugZapIcon,
    subtitle: 'Trigger',
    title: 'Manual Trigger',
    handleTarget: [],
    handleSource: ['default'],
    type: WORKFLOW_NODE_TYPE.TRIGGER,
  },
} as const;
