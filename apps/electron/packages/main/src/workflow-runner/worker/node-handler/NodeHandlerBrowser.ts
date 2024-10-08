import {
  ExtensionBrowserTab,
  isObject,
  isValidURL,
  parseJSON,
  sleepWithRetry,
  type BrowserType,
} from '@altdot/shared';
import type {
  WorkflowNodeHandlerExecute,
  WorkflowNodeHandlerExecuteReturn,
} from './WorkflowNodeHandler';
import WorkflowNodeHandler from './WorkflowNodeHandler';
import WorkflowFileHandle from '../utils/WorkflowFileHandle';
import {
  WorkflowNodeUseBrowser,
  WORKFLOW_NODE_TYPE,
  WorkflowNodeBrowserTab,
} from '@altdot/workflow';
import { getExactType } from '../utils/workflow-runner-utils';
import WorkflowRunnerIPC from '../runner/WorkflowRunnerIPC';
import WorkflowRunner from '../runner/WorkflowRunner';

const browserName: Record<BrowserType, string> = {
  firefox: 'Firefox',
  chrome: 'Google Chrome',
  edge: 'Microsoft Edge',
};

async function getOpenedBrowser(
  ipc: WorkflowRunnerIPC,
  preferBrowser: WorkflowNodeUseBrowser['data']['preferBrowser'],
) {
  const connectedBrowsers = await ipc.invoke('browser:get-connected-browsers');

  let browserId: string | null = null;
  if (preferBrowser === 'any') {
    browserId =
      connectedBrowsers.sort((a, z) => z.lastAccessed - a.lastAccessed)[0]
        ?.id ?? null;
  } else {
    browserId =
      connectedBrowsers.find((browser) => browser.type === preferBrowser)?.id ??
      null;
  }

  return browserId;
}

async function findBrowser(
  ipc: WorkflowRunnerIPC,
  preferBrowser: WorkflowNodeUseBrowser['data']['preferBrowser'],
) {
  const browserApps = await ipc.invoke('installed-apps:get-browsers');

  if (preferBrowser === 'any') {
    const browser =
      browserApps.find((browser) => browser.type === 'chrome') ||
      browserApps[0];
    if (!browser) throw new Error("Couldn't find a supported browser app");

    return browser;
  }

  const browser = browserApps.find((app) => app.type === preferBrowser);
  if (!browser) {
    throw new Error(`Couldn't find "${browserName[preferBrowser]}" browser`);
  }

  return browser;
}

const MAX_RETRY_FIND_CONNECT_BROWSER = 5;

export class NodeHandleUseBrowser extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.USE_BROWSER> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.USE_BROWSER, {
      dataValidation: [
        { key: 'preferBrowser', name: 'Preferred browser', types: ['String'] },
        {
          key: 'useOpenedBrowser',
          name: 'Use opened browser',
          types: ['Boolean'],
        },
      ],
    });
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.USE_BROWSER>): Promise<WorkflowNodeHandlerExecuteReturn> {
    if (node.data.useOpenedBrowser) {
      const browserId = await getOpenedBrowser(
        runner.ipc,
        node.data.preferBrowser,
      );
      if (browserId) {
        runner.browser.setContext({
          browserId,
          tabId: null,
        });

        return { value: null };
      }
    }

    const browser = await findBrowser(runner.ipc, node.data.preferBrowser);
    await runner.ipc.invoke('shell:open-path', browser.location);

    let retryCount = 0;
    await sleepWithRetry(async () => {
      if (retryCount > MAX_RETRY_FIND_CONNECT_BROWSER) {
        throw new Error(
          "Couldn't connect to the opened browser. Make sure the extension is installed or enabled.",
        );
      }

      retryCount += 1;

      const browsers = await runner.ipc.invoke(
        'browser:get-connected-browsers',
      );

      const activeBrowser = browsers.find(
        (connectedBrowser) => connectedBrowser.type === browser.type,
      );
      if (activeBrowser) {
        runner.browser.setContext({
          tabId: null,
          browserId: activeBrowser.id,
        });
      }

      return Boolean(activeBrowser);
    }, 2000);

    return {
      value: null,
    };
  }

  destroy() {}
}

export class NodeHandlerBrowserTab extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.BROWSER_TAB> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.BROWSER_TAB);
  }

  private async useActiveTab(runner: WorkflowRunner, browserId: string) {
    const activeTab = await runner.ipc.invoke(
      'browser:get-active-tab',
      browserId,
    );
    if (!activeTab) throw new Error("Couldn't find active tab");

    runner.browser.setContext(activeTab);

    return {
      url: activeTab.url,
      title: activeTab.title,
    };
  }

  private async createNewTab(
    runner: WorkflowRunner,
    node: WorkflowNodeBrowserTab,
    browserId: string,
  ) {
    const url = node.data.newTabURL;
    if (
      typeof url !== 'string' ||
      !url.startsWith('http') ||
      !isValidURL(node.data.newTabURL)
    ) {
      throw new Error(`"${node.data.newTabURL}" is invalid URL`);
    }

    const activeTab = await runner.ipc.invoke(
      'browser:new-tab',
      browserId,
      url,
    );
    if (!activeTab) throw new Error("Couldn't create a new tab");

    runner.browser.setContext(activeTab);

    return {
      url: activeTab.url,
      title: activeTab.title,
    };
  }

  private async findTab(
    runner: WorkflowRunner,
    node: WorkflowNodeBrowserTab,
    browserId: string,
  ) {
    const [tab] = (await runner.ipc.invoke('browser:actions', {
      browserId,
      name: 'tabs:query',
      args: [{ url: node.data.findTabFiler }],
    })) as ExtensionBrowserTab[];
    if (!tab) {
      throw new Error(
        `Couldn't find a tab with "${node.data.findTabFiler}" match pattern`,
      );
    }

    runner.browser.setContext({
      tabId: tab.id,
    });

    return {
      url: '',
      title: '',
    };
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.BROWSER_TAB>): Promise<WorkflowNodeHandlerExecuteReturn> {
    let { browserId } = runner.browser.getContext();
    if (!browserId) {
      browserId = await getOpenedBrowser(runner.ipc, 'any');
      if (!browserId) {
        throw new Error(
          'Couldn\'t find an active browser. Use the "Use Browser" node before using this node.',
        );
      }

      runner.browser.setContext({ browserId });
    }

    let value: {
      url: string;
      title: string;
    } | null = null;

    switch (node.data.action) {
      case 'use-active-tab':
        value = await this.useActiveTab(runner, browserId);
        break;
      case 'open-tab':
        value = await this.createNewTab(runner, node, browserId);
        break;
      case 'find-tab':
        value = await this.findTab(runner, node, browserId);
        break;
      default:
        throw new Error(`"${node.data.action}" is an invalid action`);
    }

    return { value };
  }

  destroy() {}
}

export class NodeHandlerBrowserMouse extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.BROWSER_MOUSE> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.BROWSER_MOUSE, {
      dataValidation: [
        { key: 'selector', name: 'Selector', types: ['String'] },
      ],
    });
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.BROWSER_MOUSE>): Promise<WorkflowNodeHandlerExecuteReturn> {
    const selector = node.data.selector.trim();
    if (!selector) throw new Error('Element selector is empty');

    switch (node.data.action) {
      case 'click':
        await runner.browser.sendMessage('tabs:click', { selector });
        break;
      case 'mouse-up':
        await runner.browser.sendMessage('tabs:mouse-up', { selector });
        break;
      case 'mouse-down':
        await runner.browser.sendMessage('tabs:mouse-down', { selector });
        break;
      default:
        throw new Error('Unknown mouse action');
    }

    return {
      value: null,
    };
  }

  destroy() {}
}

export class NodeHandlerBrowserKeyboard extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.BROWSER_KEYBOARD> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.BROWSER_KEYBOARD, {
      dataValidation: [
        { key: 'key', name: 'Key', types: ['String'] },
        { key: 'text', name: 'Text', types: ['String'] },
        { key: 'delay', name: 'Delay', types: ['Number'] },
      ],
    });
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.BROWSER_KEYBOARD>): Promise<WorkflowNodeHandlerExecuteReturn> {
    const selector = node.data.selector.trim();
    if (!selector) throw new Error('Element selector is empty');

    const { action, key, text, modifiers, clearFormValue, delay } = node.data;

    switch (action) {
      case 'key-down':
        await runner.browser.sendMessage('tabs:key-down', { selector }, key, {
          modifiers,
        });
        break;
      case 'key-up':
        await runner.browser.sendMessage('tabs:key-up', { selector }, key, {
          delay,
          modifiers,
        });
        break;
      case 'press':
        await runner.browser.sendMessage('tabs:press', { selector }, key, {
          delay,
          modifiers,
        });
        break;
      case 'type':
        await runner.browser.sendMessage('tabs:type', { selector }, text, {
          delay,
          clearValue: clearFormValue,
        });
        break;
      default:
        throw new Error('Unknown keyboard action');
    }

    return {
      value: null,
    };
  }

  destroy() {}
}

export class NodeHandlerGetElementText extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.GET_ELEMENT_TEXT> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.GET_ELEMENT_TEXT, {
      dataValidation: [
        { key: 'selector', name: 'Selector', types: ['String'] },
        { key: 'outerHTML', name: 'Outer HTML', types: ['Boolean'] },
        {
          key: 'visibleTextOnly',
          name: 'Visible text only',
          types: ['Boolean'],
        },
      ],
    });
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.GET_ELEMENT_TEXT>): Promise<WorkflowNodeHandlerExecuteReturn> {
    const selector = node.data.selector.trim();
    if (!selector) throw new Error('Element selector is empty');

    let value = '';

    switch (node.data.action) {
      case 'get-text':
        value = await runner.browser.sendMessage(
          'tabs:get-text',
          { selector },
          {
            onlyVisibleText: node.data.visibleTextOnly,
          },
        );
        break;
      case 'get-html':
        value = await runner.browser.sendMessage(
          'tabs:get-html',
          { selector },
          {
            outerHTML: node.data.outerHTML,
          },
        );
        break;
      default:
        throw new Error('Unknown get text node action');
    }

    return {
      value,
    };
  }

  destroy() {}
}

export class NodeHandlerWaitSelector extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.WAIT_SELECTOR> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.WAIT_SELECTOR, {
      dataValidation: [
        { key: 'state', name: 'State', types: ['String'] },
        { key: 'timeout', name: 'Timeout', types: ['Number'] },
        { key: 'selector', name: 'Selector', types: ['String'] },
      ],
    });
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.WAIT_SELECTOR>): Promise<WorkflowNodeHandlerExecuteReturn> {
    const selector = node.data.selector.trim();
    if (!selector) throw new Error('Element selector is empty');

    const { state, timeout } = node.data;
    await runner.browser.sendMessage(
      'tabs:wait-for-selector',
      { selector },
      {
        state,
        timeout,
      },
    );

    return {
      value: null,
    };
  }

  destroy() {}
}

export class NodeHandlerElementAttributes extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.ELEMENT_ATTRIBUTES> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.ELEMENT_ATTRIBUTES, {
      dataValidation: [
        { key: 'selector', name: 'Selector', types: ['String'] },
        { key: 'getAttrs', name: 'Get attribute names', types: ['String'] },
      ],
    });
  }

  private async setAttributes({
    node,
    runner,
    selector,
  }: Pick<
    WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.ELEMENT_ATTRIBUTES>,
    'node' | 'runner'
  > & { selector: string }) {
    const { data } = await runner.sandbox.evaluateExpAndApply(
      node.data.$setAttrsExp,
      node.data,
    );
    let attrs: Record<string, string> = {};

    if (data.useSetAttrsJSON) {
      const jsonAttrs =
        typeof data.setAttrsJSON === 'string'
          ? parseJSON<Record<string, string>>(
              data.setAttrsJSON,
              data.setAttrsJSON,
            )
          : data.setAttrsJSON;
      if (!isObject(jsonAttrs)) {
        throw new Error(
          `Invalid JSON attributes value. Expected "Object" but got "${getExactType(jsonAttrs)}"`,
        );
      }

      attrs = jsonAttrs as Record<string, string>;
    } else {
      data.setAttrs.forEach((item) => {
        attrs[item.name] = item.value;
      });
    }

    await runner.browser.sendMessage(
      'tabs:set-attributes',
      { selector },
      attrs,
    );
  }

  private async getAttributes({
    node,
    runner,
    selector,
  }: Pick<
    WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.ELEMENT_ATTRIBUTES>,
    'node' | 'runner'
  > & { selector: string }) {
    const names = node.data.getAttrs.split(',');
    const result = await runner.browser.sendMessage(
      'tabs:get-attributes',
      { selector },
      names,
    );

    return result;
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.ELEMENT_ATTRIBUTES>): Promise<WorkflowNodeHandlerExecuteReturn> {
    const selector = node.data.selector.trim();
    if (!selector) throw new Error('Element selector is empty');

    let value: unknown;

    switch (node.data.action) {
      case 'set':
        await this.setAttributes({ node, runner, selector });
        break;
      case 'get':
        value = await this.getAttributes({ node, runner, selector });
        break;
    }

    return { value };
  }

  destroy() {}
}

export class NodeHandlerSelectFile extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.SELECT_FILE> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.SELECT_FILE);
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.SELECT_FILE>): Promise<WorkflowNodeHandlerExecuteReturn> {
    const { browserId, tabId } = runner.browser.getContext();
    if (browserId === null || tabId === null) {
      throw new Error(
        'Couldn\'t find an active tab. Use the "Browser Tab" node before using this node.',
      );
    }

    const selector = node.data.selector.trim();
    if (!selector) throw new Error('Element selector is empty');

    let paths: string[] = [];
    if (node.data.mode === 'json') {
      const currentFiles = Array.isArray(node.data.jsonInput)
        ? node.data.jsonInput
        : parseJSON(node.data.jsonInput, node.data.jsonInput);
      if (!Array.isArray(currentFiles)) {
        throw new Error(
          `Invalid JSON file paths type. Expected array of strings but got ${getExactType(currentFiles)}`,
        );
      }

      paths = currentFiles;
    } else if (node.data.mode === 'list') {
      paths = node.data.files;
    }

    paths = paths.map((path) => {
      if (!WorkflowFileHandle.isWorkflowFileHandle(path)) return path;

      return path.path;
    });

    await runner.ipc.invoke(
      'browser:select-files',
      {
        paths,
        tabId,
        selector,
        browserId,
      },
      {
        action: node.data.action,
      },
    );

    return {
      value: null,
    };
  }

  destroy() {}
}

export class NodeHandlerBrowserSelect extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.BROWSER_SELECT> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.BROWSER_SELECT, {
      dataValidation: [{ key: 'values', name: 'Options', types: ['Array'] }],
    });
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.BROWSER_SELECT>): Promise<WorkflowNodeHandlerExecuteReturn> {
    runner.browser.checkIfHasBrowser();

    const selector = node.data.selector.trim();
    if (!selector) throw new Error('Element selector is empty');

    let values: string[] = [];
    if (node.data.mode === 'json') {
      const currentVals = Array.isArray(node.data.jsonInput)
        ? node.data.jsonInput
        : parseJSON(node.data.jsonInput, node.data.jsonInput);
      if (!Array.isArray(currentVals)) {
        throw new Error(
          `Invalid JSON options. Expected array of strings but got ${getExactType(currentVals)}`,
        );
      }

      values = currentVals;
    } else if (node.data.mode === 'list') {
      values = node.data.values;
    }

    await runner.browser.sendMessage('tabs:select', { selector }, values);

    return {
      value: null,
    };
  }

  destroy() {}
}
