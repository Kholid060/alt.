import type { WorkflowNodeUseBrowser } from '#packages/common/interface/workflow-nodes.interface';
import IPCRenderer from '#packages/common/utils/IPCRenderer';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import { isValidURL, type BrowserType } from '@repo/shared';
import type {
  WorkflowNodeHandlerExecute,
  WorkflowNodeHandlerExecuteReturn,
} from './WorkflowNodeHandler';
import WorkflowNodeHandler from './WorkflowNodeHandler';
import { shell } from 'electron';
import { sleepWithRetry } from '/@/utils/helper';

const browserName: Record<BrowserType, string> = {
  firefox: 'Firefox',
  chrome: 'Google Chrome',
  edge: 'Microsoft Edge',
};

async function getOpenedBrowser(
  preferBrowser: WorkflowNodeUseBrowser['data']['preferBrowser'],
) {
  const connectedBrowsers = await IPCRenderer.invokeWithError(
    'browser:get-connected-browsers',
  );

  let browserId: string | null = null;
  if (preferBrowser === 'any') {
    browserId =
      connectedBrowsers.find((browser) => browser.active)?.id ??
      connectedBrowsers[0]?.id ??
      null;
  } else {
    browserId =
      connectedBrowsers.find((browser) => browser.type === preferBrowser)?.id ??
      null;
  }

  return browserId;
}

async function findBrowser(
  preferBrowser: WorkflowNodeUseBrowser['data']['preferBrowser'],
) {
  const browserApps = await IPCRenderer.invokeWithError('apps:get-browsers');

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

export class NodeHandlerOpenBrowser extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.USE_BROWSER> {
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
      const browserId = await getOpenedBrowser(node.data.preferBrowser);
      if (browserId) {
        runner.browser.setContext({
          browserId,
          tabId: null,
        });

        return { value: null };
      }
    }

    const browser = await findBrowser(node.data.preferBrowser);
    await shell.openPath(browser.location);

    let retryCount = 0;
    await sleepWithRetry(async () => {
      if (retryCount > MAX_RETRY_FIND_CONNECT_BROWSER) {
        throw new Error(
          "Couldn't connect to the opened browser. Make sure the extension is installed or enabled.",
        );
      }

      retryCount += 1;

      const browsers = await IPCRenderer.invokeWithError(
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

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.BROWSER_TAB>): Promise<WorkflowNodeHandlerExecuteReturn> {
    let { browserId } = runner.browser.getContext();
    if (!browserId) {
      browserId = await getOpenedBrowser('any');
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
    };

    if (node.data.action === 'use-active-tab') {
      const activeTab = await IPCRenderer.invokeWithError(
        'browser:get-active-tab',
        browserId,
      );
      if (!activeTab) throw new Error("Couldn't find active tab");

      runner.browser.setContext({ browserId, tabId: activeTab.id });
      value = {
        url: activeTab.url,
        title: activeTab.title,
      };
    } else {
      const url = node.data.newTabURL;
      if (
        typeof url !== 'string' ||
        !url.startsWith('http') ||
        !isValidURL(node.data.newTabURL)
      ) {
        throw new Error(`"${node.data.newTabURL}" is invalid URL`);
      }

      const activeTab = await IPCRenderer.invokeWithError(
        'browser:new-tab',
        browserId,
        url,
      );
      if (!activeTab) throw new Error("Couldn't create a new tab");

      runner.browser.setContext({ browserId, tabId: activeTab.id });
      value = {
        url: activeTab.url,
        title: activeTab.title,
      };
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
        { key: 'delay', name: 'Text', types: ['Number'] },
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

export class NodeHandlerBrowserGetElementText extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.GET_ELEMENT_TEXT> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.GET_ELEMENT_TEXT, {
      dataValidation: [
        { key: 'selector', name: 'Text', types: ['String'] },
        { key: 'outerHTML', name: 'Text', types: ['Boolean'] },
        { key: 'visibleTextOnly', name: 'Text', types: ['Boolean'] },
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
