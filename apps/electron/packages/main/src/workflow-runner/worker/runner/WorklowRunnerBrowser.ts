import type { ExtensionBrowserTabContext } from '#packages/common/interface/extension.interface';
import type {
  AllButLast,
  Last,
  SetNullable,
} from '#packages/common/interface/utils.interface';
import { isIPCEventError } from '#packages/common/utils/helper';
import type {
  AllButFirstOrLast,
  ExtensionActiveTabActionWSEvents,
  WSAckErrorResult,
} from '@altdot/shared';
import WorkflowRunnerIPC from './WorkflowRunnerIPC';
import { WORKFLOW_NODE_TYPE, WORKFLOW_NODES } from '@altdot/workflow';

export type WorkflowRunnerBrowserContext = SetNullable<
  NonNullable<ExtensionBrowserTabContext>,
  'browserId' | 'tabId'
>;

class WorkflowRunnerBrowser {
  private context: WorkflowRunnerBrowserContext = {
    url: '',
    title: '',
    tabId: null,
    browserId: null,
  };

  constructor(private readonly ipc: WorkflowRunnerIPC) {}

  tabAvailable(): boolean {
    return this.context.tabId !== null && this.context.browserId !== null;
  }

  sendMessage<
    T extends keyof ExtensionActiveTabActionWSEvents,
    P extends Parameters<ExtensionActiveTabActionWSEvents[T]>,
    R extends Exclude<Parameters<Last<P>>[0], WSAckErrorResult>,
  >(name: T, ...args: AllButFirstOrLast<P>): Promise<R> {
    const { browserId, tabId } = this.context;
    if (browserId === null || tabId === null) {
      throw new Error(
        `Couldn't find an active tab. Use the "${WORKFLOW_NODES[WORKFLOW_NODE_TYPE.BROWSER_TAB].title}" node before using this node.`,
      );
    }

    return this.ipc
      .invoke('browser:actions', {
        name,
        browserId: browserId,
        args: [{ tabId }, ...args] as unknown as AllButLast<P>,
      })
      .then((result) => {
        if (isIPCEventError(result)) throw new Error(result.message);

        return result;
      }) as Promise<R>;
  }

  getContext() {
    return Object.freeze(this.context);
  }

  setContext(ctxData: Partial<WorkflowRunnerBrowserContext>) {
    this.context = { ...this.context, ...ctxData };
  }

  checkIfHasBrowser() {
    const { browserId, tabId } = this.context;
    if (browserId === null || tabId === null) {
      throw new Error(
        'Couldn\'t find an active tab. Use the "Browser Tab" node before using this node.',
      );
    }
  }
}

export default WorkflowRunnerBrowser;
