import {
  WorkflowNodeHandleSource,
  WorkflowNodeHandleTarget,
  WorkflowNodesMap,
} from '#packages/common/interface/workflow-nodes.interface';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import {
  BellIcon,
  CircleSlash2Icon,
  ClipboardIcon,
  CommandIcon,
  FileCode2Icon,
  FileIcon,
  GlobeIcon,
  KeyboardIcon,
  LucideIcon,
  PlugZapIcon,
  RepeatIcon,
  SplitIcon,
  TimerIcon,
} from 'lucide-react';
import { WorkflowEditorNodeGroup } from '/@/interface/workflow-editor.interface';

export const WORKFLOW_NODES: {
  [T in WORKFLOW_NODE_TYPE]: {
    type: T;
    title: string;
    icon: LucideIcon;
    subtitle?: string;
    invisible?: boolean;
    group: WorkflowEditorNodeGroup;
    defaultData: WorkflowNodesMap[T]['data'];
    handleTarget: WorkflowNodeHandleTarget[];
    handleSource: WorkflowNodeHandleSource[];
  };
} = {
  [WORKFLOW_NODE_TYPE.COMMAND]: {
    title: 'Command',
    invisible: true,
    group: 'Commands',
    icon: CommandIcon,
    subtitle: 'Command',
    handleSource: [], // no need, has its own node component
    handleTarget: [],
    defaultData: {
      args: [],
      icon: '',
      title: '',
      argsValue: {},
      commandId: '',
      isDisabled: false,
      extension: { id: '', title: '', version: '' },
    },
    type: WORKFLOW_NODE_TYPE.COMMAND,
  },
  [WORKFLOW_NODE_TYPE.DO_NOTHING]: {
    group: 'Core',
    invisible: true,
    title: 'Do Nothing',
    icon: CircleSlash2Icon,
    handleTarget: ['default'],
    handleSource: ['default'],
    defaultData: {
      isDisabled: false,
    },
    type: WORKFLOW_NODE_TYPE.DO_NOTHING,
  },
  [WORKFLOW_NODE_TYPE.LOOP]: {
    group: 'Flow',
    title: 'Looping',
    icon: RepeatIcon,
    handleTarget: [],
    handleSource: [],
    defaultData: {
      varName: '',
      expression: '',
      isDisabled: false,
      dataSource: 'prev-node',
    },
    subtitle: 'Control Flow',
    type: WORKFLOW_NODE_TYPE.LOOP,
  },
  [WORKFLOW_NODE_TYPE.TRIGGER]: {
    icon: PlugZapIcon,
    group: 'Triggers',
    subtitle: 'Trigger',
    title: 'Manual Trigger',
    handleTarget: [],
    handleSource: ['default'],
    defaultData: {
      isDisabled: false,
    },
    type: WORKFLOW_NODE_TYPE.TRIGGER,
  },
  [WORKFLOW_NODE_TYPE.CODE]: {
    group: 'Core',
    subtitle: 'Core',
    title: 'Run Code',
    icon: FileCode2Icon,
    defaultData: {
      jsCode: '',
      isDisabled: false,
    },
    handleTarget: ['default'],
    handleSource: ['default'],
    type: WORKFLOW_NODE_TYPE.CODE,
  },
  [WORKFLOW_NODE_TYPE.DELAY]: {
    group: 'Core',
    subtitle: 'Core',
    title: 'Delay',
    icon: TimerIcon,
    defaultData: {
      delayMs: 500,
      isDisabled: false,
    },
    handleTarget: ['default'],
    handleSource: ['default'],
    type: WORKFLOW_NODE_TYPE.DELAY,
  },
  [WORKFLOW_NODE_TYPE.CLIPBOARD]: {
    group: 'Core',
    subtitle: 'Core',
    title: 'Clipboard',
    icon: ClipboardIcon,
    defaultData: {
      varName: '',
      action: 'read',
      format: 'text',
      isDisabled: false,
      insertToVar: false,
      newClipboardVal: '',
    },
    handleTarget: ['default'],
    handleSource: ['default'],
    type: WORKFLOW_NODE_TYPE.CLIPBOARD,
  },
  [WORKFLOW_NODE_TYPE.CONDITIONAL]: {
    group: 'Flow',
    subtitle: 'Control Flow',
    title: 'Conditional',
    icon: SplitIcon,
    defaultData: {
      conditions: [],
      isDisabled: false,
    },
    handleTarget: ['default'],
    handleSource: ['default'],
    type: WORKFLOW_NODE_TYPE.CONDITIONAL,
  },
  [WORKFLOW_NODE_TYPE.FILE_SYSTEM]: {
    group: 'Core',
    subtitle: 'Core',
    title: 'File System',
    icon: FileIcon,
    defaultData: {
      varName: '',
      fileData: '',
      filePath: '',
      action: 'read',
      isDisabled: false,
      appendFile: false,
      insertToVar: false,
    },
    handleTarget: ['default'],
    handleSource: ['default'],
    type: WORKFLOW_NODE_TYPE.FILE_SYSTEM,
  },
  [WORKFLOW_NODE_TYPE.HTTP_REQUEST]: {
    group: 'Core',
    subtitle: 'Core',
    title: 'HTTP Request',
    icon: GlobeIcon,
    defaultData: {
      headers: [],
      queries: [],
      rawBody: {
        data: '',
        contentType: '',
      },
      response: {
        varName: '',
        insertToVar: false,
      },
      url: '',
      jsonBody: '',
      method: 'GET',
      bodyType: 'none',
      formDataBody: [],
      timeoutMs: 10000,
      isDisabled: false,
      urlEncodedBody: [],
    },
    handleTarget: ['default'],
    handleSource: ['default'],
    type: WORKFLOW_NODE_TYPE.HTTP_REQUEST,
  },
  [WORKFLOW_NODE_TYPE.NOTIFICATION]: {
    group: 'Core',
    subtitle: 'Core',
    title: 'Notification',
    icon: BellIcon,
    defaultData: {
      body: '',
      title: '',
      subtitle: '',
      silent: false,
      isDisabled: false,
    },
    handleTarget: ['default'],
    handleSource: ['default'],
    type: WORKFLOW_NODE_TYPE.NOTIFICATION,
  },
  [WORKFLOW_NODE_TYPE.TRIGGER_SHORTCUT]: {
    group: 'Triggers',
    subtitle: 'Trigger',
    title: 'Hotkey Trigger',
    icon: KeyboardIcon,
    defaultData: {
      shortcut: null,
      isDisabled: false,
    },
    handleTarget: [],
    handleSource: ['default'],
    type: WORKFLOW_NODE_TYPE.TRIGGER_SHORTCUT,
  },
} as const;
