import type { WorkflowNodeUseBrowser } from '#packages/common/interface/workflow-nodes.interface';
import IPCRenderer from '#packages/common/utils/IPCRenderer';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import type { BrowserType } from '@repo/shared';
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
      connectedBrowsers[0].id ??
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
  private controller = new AbortController();
  private timers = new Set<NodeJS.Timeout>();

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
        runner.setBrowserCtx({
          tabId: null,
          id: browserId,
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
        runner.setBrowserCtx({
          tabId: null,
          id: activeBrowser.id,
        });
      }

      return Boolean(activeBrowser);
    }, 2000);

    return {
      value: null,
    };
  }

  destroy() {
    this.controller.abort();
    this.timers.forEach((value) => {
      clearTimeout(value);
    });

    this.timers.clear();
  }
}
