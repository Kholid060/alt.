import {
  CUSTOM_SCHEME,
  PRELOAD_API_KEY,
} from '#common/utils/constant/constant';
import type {
  CommandJSONViews,
  CommandLaunchContext,
  CommandViewJSONLaunchContext,
} from '@altdot/extension';
import type { BetterMessagePortSync, EventMapEmit } from '@altdot/shared';
import { BetterMessagePort } from '@altdot/shared';
import type { IPCUserExtensionEventsMap } from '#common/interface/ipc-events.interface';
import type {
  ExtensionBrowserTabContext,
  ExtensionCommandExecutePayload,
} from '#packages/common/interface/extension.interface';
import ExtensionWorkerMessagePort from '../extension/ExtensionWorkerMessagePort';
import type { ExtensionCommandWorkerInitMessage } from '../interface/extension.interface';
import type { MessagePortSharedCommandWindowEvents } from '#packages/common/interface/message-port-events.interface';
import { createExtensionAPI } from '#common/utils/extension/extension-api-factory';

type ExtensionCommand = (
  payload: CommandLaunchContext | CommandViewJSONLaunchContext,
) => void | Promise<void | CommandJSONViews>;

async function loadExtensionCommand(extensionId: string, commandId: string) {
  const filePath = `${CUSTOM_SCHEME.extension}://${extensionId}/command/${commandId}/@renderer`;
  const { default: executeCommand } = (await import(
    /* @vite-ignore */ filePath
  )) as {
    default: ExtensionCommand;
  };

  return executeCommand;
}

interface InitExtensionAPIData {
  key: string;
  commandId: string;
  mainMessagePort: MessagePort;
  browserCtx: ExtensionBrowserTabContext;
  messagePort: BetterMessagePortSync<MessagePortSharedCommandWindowEvents>;
}
function initExtensionAPI({
  key,
  commandId,
  browserCtx,
  messagePort,
  mainMessagePort,
}: InitExtensionAPIData) {
  const extensionWorkerMessage = new ExtensionWorkerMessagePort({
    key: key,
    commandId,
    browserCtx,
    messagePort: mainMessagePort,
  });

  messagePort.sendMessage('extension:query-clear-value');

  const extensionAPI = createExtensionAPI({
    browserCtx,
    messagePort,
    sendMessage: extensionWorkerMessage.sendMessage.bind(
      extensionWorkerMessage,
    ) as EventMapEmit<IPCUserExtensionEventsMap>,
    context: extensionWorkerMessage,
  });

  Object.defineProperty(self, PRELOAD_API_KEY.extension, {
    writable: false,
    configurable: false,
    value: extensionAPI,
  });
}

async function getCommandExecution({
  commandId,
  extensionId,
}: {
  commandId: string;
  extensionId: string;
}) {
  const executeCommand = await loadExtensionCommand(extensionId, commandId);
  if (typeof executeCommand !== 'function') {
    throw new Error('The extension command is not a function');
  }

  return executeCommand;
}

interface CommandRunnerData extends ExtensionCommandExecutePayload {
  runnerId: string;
  executeCommand: ExtensionCommand;
  messagePort: InitExtensionAPIData['messagePort'];
}

async function commandViewJSONRunner({
  runnerId,
  commandId,
  extensionId,
  messagePort,
  launchContext,
  executeCommand,
}: CommandRunnerData) {
  const updateView: CommandViewJSONLaunchContext['updateView'] = (viewData) => {
    messagePort.sendMessage('command-json:update-ui', {
      viewData,
      runnerId,
      commandId,
      extensionId,
    });
  };

  const viewData = await executeCommand({
    updateView,
    ...launchContext,
  });
  updateView(viewData as CommandJSONViews);
}

async function commandActionRunner({
  launchContext,
  executeCommand,
}: CommandRunnerData) {
  const returnValue = await executeCommand(launchContext);

  self.postMessage({ type: 'finish', message: returnValue });
}

self.onmessage = async ({
  ports,
  data,
}: MessageEvent<ExtensionCommandWorkerInitMessage>) => {
  try {
    if (!ports.length || data?.type !== 'init') {
      self.postMessage({
        type: 'error',
        message: 'Invalid message payload',
      });
      return;
    }

    self.name = '';
    self.onmessage = null;

    const messagePort = BetterMessagePort.createStandalone('sync', ports[1]);
    const { commandId, extensionId, browserCtx } = data.payload;

    const executeCommand = await getCommandExecution({
      commandId,
      extensionId,
    });
    initExtensionAPI({
      commandId,
      messagePort,
      key: extensionId,
      mainMessagePort: ports[0],
      browserCtx: browserCtx ?? null,
    });

    const commandRunnerPayload: CommandRunnerData = {
      ...data.payload,
      messagePort,
      executeCommand,
      runnerId: data.runnerId,
    };

    if (data.command.type === 'action') {
      await commandActionRunner(commandRunnerPayload);
    } else if (data.command.type === 'view:json') {
      await commandViewJSONRunner(commandRunnerPayload);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: (error as Error).message,
    });
  }
};
