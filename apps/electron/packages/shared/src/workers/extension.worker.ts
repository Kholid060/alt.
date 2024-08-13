import {
  CUSTOM_SCHEME,
  PRELOAD_API_KEY,
} from '#common/utils/constant/constant';
import type {
  CommandLaunchContext,
  ExtensionAPI,
  ExtensionMessagePortEventAsync,
} from '@altdot/extension';
import { BetterMessagePort } from '@altdot/shared';
import type {
  ExtensionBrowserTabContext,
  ExtensionCommandExecutePayload,
} from '#packages/common/interface/extension.interface';
import ExtensionWorkerMessagePort from '../extension/ExtensionWorkerMessagePort';
import type { ExtensionCommandWorkerInitMessage } from '../interface/extension.interface';
import type { MessagePortSharedCommandWindowEvents } from '#packages/common/interface/message-port-events.interface';
import { createExtensionAPI } from '#common/utils/extension/extension-api-factory';

type ExtensionCommand = (payload: CommandLaunchContext) => void;

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
  platform: ExtensionAPI.Runtime.PlatformInfo;
  messagePort: BetterMessagePort<
    ExtensionMessagePortEventAsync,
    MessagePortSharedCommandWindowEvents
  >;
}
function initExtensionAPI({
  key,
  platform,
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

  messagePort.sync.sendMessage('extension:query-clear-value');

  const extensionAPI = createExtensionAPI({
    platform,
    browserCtx,
    messagePort,
    sendMessage: extensionWorkerMessage.sendMessage.bind(
      extensionWorkerMessage,
    ),
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

async function commandActionRunner({
  launchContext,
  executeCommand,
}: CommandRunnerData) {
  const returnValue = await executeCommand(launchContext);

  self.postMessage({ type: 'finish', message: returnValue });
}

self.onmessage = async ({
  data,
  ports,
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

    const messagePort = new BetterMessagePort(ports[1], {
      eventTimeoutMs: 120_000, // 2 minutes
    });
    const { commandId, extensionId, browserCtx, platform } = data.payload;

    initExtensionAPI({
      platform,
      commandId,
      messagePort,
      key: extensionId,
      mainMessagePort: ports[0],
      browserCtx: browserCtx ?? null,
    });
    const executeCommand = await getCommandExecution({
      commandId,
      extensionId,
    });

    const commandRunnerPayload: CommandRunnerData = {
      ...data.payload,
      messagePort,
      executeCommand,
      runnerId: data.runnerId,
    };

    await commandActionRunner(commandRunnerPayload);
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: (error as Error).message,
    });
  }
};
