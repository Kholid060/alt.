import extensionApiBuilder from '@repo/extension-core/dist/extensionApiBuilder';
import {
  CUSTOM_SCHEME,
  PRELOAD_API_KEY,
} from '#common/utils/constant/constant';
import type { ExtensionManifest } from '@repo/extension-core';
import type {
  CommandJSONViews,
  CommandLaunchContext,
  CommandViewJSONLaunchContext,
  ExtensionMessagePortEvent,
} from '@repo/extension';
import type { EventMapEmit } from '@repo/shared';
import { AMessagePort } from '@repo/shared';
import { createExtensionElementHandle } from '#common/utils/extension/extension-element-handle';
import type { IPCUserExtensionEventsMap } from '#common/interface/ipc-events.interface';
import {
  extensionAPIGetIconURL,
  extensionAPISearchPanelEvent,
  extensionAPIUiToast,
} from '#common/utils/extension/extension-api-value';
import type { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';
import ExtensionWorkerMessagePort from '../extension/ExtensionWorkerMessagePort';
import type { ExtensionCommandWorkerInitMessage } from '../inteface/extension.interface';

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
  messagePort: MessagePort;
  mainMessagePort: MessagePort;
  manifest: ExtensionManifest;
}
function initExtensionAPI({
  key,
  manifest,
  commandId,
  messagePort,
  mainMessagePort,
}: InitExtensionAPIData) {
  const extensionWorkerMessage = new ExtensionWorkerMessagePort({
    key: key,
    commandId,
    messagePort: mainMessagePort,
  });

  const aMessagePort = new AMessagePort<ExtensionMessagePortEvent>(messagePort);

  const extensionAPI = Object.freeze(
    extensionApiBuilder({
      values: {
        manifest,
        ...extensionAPIGetIconURL(),
        ...extensionAPIUiToast(aMessagePort),
        ...extensionAPISearchPanelEvent(aMessagePort),
        'browser.activeTab.findElement': (selector) => {
          return createExtensionElementHandle({
            selector,
            sendMessage: extensionWorkerMessage.sendMessage.bind(
              extensionWorkerMessage,
            ) as EventMapEmit<IPCUserExtensionEventsMap>,
          });
        },
        'browser.activeTab.findAllElements': (selector) => {
          return createExtensionElementHandle(
            {
              selector,
              sendMessage: extensionWorkerMessage.sendMessage.bind(
                extensionWorkerMessage,
              ) as EventMapEmit<IPCUserExtensionEventsMap>,
            },
            true,
          );
        },
      },
      context: extensionWorkerMessage,
      apiHandler: extensionWorkerMessage.sendMessage,
    }),
  );

  Object.defineProperty(self, PRELOAD_API_KEY.extension, {
    writable: false,
    value: extensionAPI,
  });
}

async function getCommandExecution({
  manifest,
  commandId,
  extensionId,
}: {
  commandId: string;
  extensionId: string;
  manifest: ExtensionManifest;
}) {
  const executeCommand = await loadExtensionCommand(extensionId, commandId);
  if (typeof executeCommand !== 'function') {
    throw new Error('The extension command is not a function');
  }

  const command = manifest.commands.find(
    (command) => command.name === commandId,
  );
  if (!command) throw new Error("Couldn't find the command");

  return executeCommand;
}

interface CommandRunnerData extends ExtensionCommandExecutePayload {
  workerId: string;
  manifest: ExtensionManifest;
  apiData: Omit<InitExtensionAPIData, 'manifest' | 'commandId'>;
}

async function commandViewJSONRunner({
  apiData,
  manifest,
  commandId,
  extensionId,
  launchContext,
}: CommandRunnerData) {
  const executeCommand = await getCommandExecution({
    manifest,
    commandId,
    extensionId,
  });
  initExtensionAPI({
    manifest,
    commandId,
    ...apiData,
  });

  const updateView: CommandViewJSONLaunchContext['updateView'] = (viewData) => {
    apiData.messagePort.postMessage({
      type: 'view-data',
      viewData: viewData,
    });
  };

  const viewData = await executeCommand({
    updateView,
    ...launchContext,
  });
  updateView(viewData as CommandJSONViews);
}

async function commandActionRunner({
  apiData,
  manifest,
  commandId,
  extensionId,
  launchContext,
}: CommandRunnerData) {
  const executeCommand = await getCommandExecution({
    manifest,
    commandId,
    extensionId,
  });
  initExtensionAPI({
    manifest,
    commandId,
    ...apiData,
  });

  const returnValue = await executeCommand(launchContext);

  self.postMessage({ type: 'finish', message: returnValue });
}

self.onmessage = async ({
  ports,
  data,
}: MessageEvent<ExtensionCommandWorkerInitMessage>) => {
  try {
    if (!ports.length || data?.type !== 'init' || !data.manifest) {
      self.postMessage({
        type: 'error',
        message: 'Invalid message payload',
      });
      return;
    }

    self.name = '';
    self.onmessage = null;

    const commandRunnerPayload: CommandRunnerData = {
      ...data.payload,
      manifest: data.manifest,
      workerId: data.workerId,
      apiData: {
        messagePort: ports[1],
        mainMessagePort: ports[0],
        key: data.payload.extensionId,
      },
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
