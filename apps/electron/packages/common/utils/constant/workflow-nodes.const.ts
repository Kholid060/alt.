import type {
  WorkflowNodesMap,
  WorkflowNodeHandleTarget,
  WorkflowNodeHandleSource,
} from '../../interface/workflow-nodes.interface';
import type { LucideIcon } from 'lucide-react';
import {
  CommandIcon,
  CircleSlash2Icon,
  RepeatIcon,
  PlugZapIcon,
  FileCode2Icon,
  TimerIcon,
  ClipboardIcon,
  SplitIcon,
  FileIcon,
  GlobeIcon,
  BellIcon,
  KeyboardIcon,
  CornerDownLeftIcon,
  CompassIcon,
  WorkflowIcon,
  ZapIcon,
} from 'lucide-react';
import type { WORKFLOW_NODE_GROUP } from './workflow.const';
import { WORKFLOW_NODE_TYPE } from './workflow.const';

export const WORKFLOW_NODES: {
  [T in WORKFLOW_NODE_TYPE]: {
    type: T;
    title: string;
    icon: LucideIcon;
    subtitle?: string;
    invisible?: boolean;
    group: (typeof WORKFLOW_NODE_GROUP)[number];
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
      $nodeType: WORKFLOW_NODE_TYPE.COMMAND,
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
      $nodeType: WORKFLOW_NODE_TYPE.DO_NOTHING,
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
      $nodeType: WORKFLOW_NODE_TYPE.LOOP,
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
      $nodeType: WORKFLOW_NODE_TYPE.TRIGGER,
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
      $nodeType: WORKFLOW_NODE_TYPE.CODE,
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
      $nodeType: WORKFLOW_NODE_TYPE.DELAY,
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
      $nodeType: WORKFLOW_NODE_TYPE.CLIPBOARD,
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
      $nodeType: WORKFLOW_NODE_TYPE.CONDITIONAL,
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
      $nodeType: WORKFLOW_NODE_TYPE.FILE_SYSTEM,
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
      $nodeType: WORKFLOW_NODE_TYPE.HTTP_REQUEST,
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
      $nodeType: WORKFLOW_NODE_TYPE.NOTIFICATION,
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
      $nodeType: WORKFLOW_NODE_TYPE.TRIGGER_SHORTCUT,
    },
    handleTarget: [],
    handleSource: ['default'],
    type: WORKFLOW_NODE_TYPE.TRIGGER_SHORTCUT,
  },
  [WORKFLOW_NODE_TYPE.BREAK_LOOP]: {
    group: 'Flow',
    subtitle: 'Control Flow',
    title: 'Break Loop',
    icon: CornerDownLeftIcon,
    defaultData: {
      loopNodeId: '',
      isDisabled: false,
      $nodeType: WORKFLOW_NODE_TYPE.BREAK_LOOP,
    },
    handleTarget: ['default'],
    handleSource: ['default'],
    type: WORKFLOW_NODE_TYPE.BREAK_LOOP,
  },
  [WORKFLOW_NODE_TYPE.USE_BROWSER]: {
    group: 'Browser',
    subtitle: 'Browser',
    title: 'Use Browser',
    icon: CompassIcon,
    defaultData: {
      isDisabled: false,
      preferBrowser: 'any',
      useOpenedBrowser: true,
      $nodeType: WORKFLOW_NODE_TYPE.USE_BROWSER,
    },
    handleTarget: ['default'],
    handleSource: ['default'],
    type: WORKFLOW_NODE_TYPE.USE_BROWSER,
  },
  [WORKFLOW_NODE_TYPE.EXECUTE_WORKFLOW]: {
    group: 'Core',
    subtitle: 'Core',
    title: 'Execute Workflow',
    icon: WorkflowIcon,
    defaultData: {
      variables: {},
      varName: '',
      workflowId: '',
      exposeVars: '',
      isDisabled: false,
      insertToVar: false,
      $nodeType: WORKFLOW_NODE_TYPE.EXECUTE_WORKFLOW,
    },
    handleTarget: ['default'],
    handleSource: ['default'],
    type: WORKFLOW_NODE_TYPE.EXECUTE_WORKFLOW,
  },
  [WORKFLOW_NODE_TYPE.TRIGGER_EXECUTE_WORKFLOW]: {
    group: 'Triggers',
    subtitle: 'Trigger',
    title: 'Trigger Execute Workflow',
    icon: ZapIcon,
    defaultData: {
      isDisabled: false,
      $nodeType: WORKFLOW_NODE_TYPE.TRIGGER_EXECUTE_WORKFLOW,
    },
    handleTarget: [],
    handleSource: ['default'],
    type: WORKFLOW_NODE_TYPE.TRIGGER_EXECUTE_WORKFLOW,
  },
} as const;
