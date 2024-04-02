import extensionApiBuilder from '@repo/extension-core/dist/extensionApiBuilder';
import ExtensionWorkerMessagePort from '../utils/extension/ExtensionWorkerMessagePort';
import {
  CUSTOM_SCHEME,
  PRELOAD_API_KEY,
} from '#common/utils/constant/constant';
import { ExtensionManifest } from '@repo/extension-core';
import { CommandWorkerInitMessage } from '../interface/command.interface';
import {
  CommandJSONViews,
  CommandLaunchContext,
  CommandViewJSONLaunchContext,
  ExtensionMessagePortEvent,
} from '@repo/extension';
import { AMessagePort } from '@repo/shared';

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
        manifest: manifest,
        'ui.searchPanel.onChanged': {
          addListener(callback) {
            aMessagePort.addListener('extension:query-change', callback);
          },
          removeListener(callback) {
            aMessagePort.removeListener('extension:query-change', callback);
          },
        },
        'ui.searchPanel.onKeydown': {
          addListener(callback) {
            aMessagePort.addListener('extension:keydown-event', callback);
          },
          removeListener(callback) {
            aMessagePort.removeListener('extension:keydown-event', callback);
          },
        },
        'shell.installedApps.getIconURL': (appId) =>
          `${CUSTOM_SCHEME.appIcon}://${appId}.png`,
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

interface CommnadRunnerData {
  commandId: string;
  workerId: string;
  extensionId: string;
  manifest: ExtensionManifest;
  launchContext: CommandLaunchContext;
  apiData: Omit<InitExtensionAPIData, 'manifest' | 'commandId'>;
}

async function commandViewJSONRunner({
  apiData,
  manifest,
  commandId,
  extensionId,
  launchContext,
}: CommnadRunnerData) {
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
  workerId,
  manifest,
  commandId,
  extensionId,
  launchContext,
}: CommnadRunnerData) {
  try {
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

    await executeCommand(launchContext);

    self.postMessage({ type: 'finish', id: workerId });
  } finally {
    self.close();
  }
}

self.onmessage = async ({
  ports,
  data,
}: MessageEvent<CommandWorkerInitMessage>) => {
  try {
    if (!ports.length || data?.type !== 'init' || !data.key || !data.manifest) {
      self.close();
      return;
    }

    const [extensionId, commandId] = self.name.split(':');
    self.name = '';
    self.onmessage = null;

    const commandRunnerPayload: CommnadRunnerData = {
      commandId,
      extensionId,
      manifest: data.manifest,
      workerId: data.workerId,
      launchContext: data.launchContext,
      apiData: {
        key: data.key,
        messagePort: ports[1],
        mainMessagePort: ports[0],
      },
    };

    if (data.commandType === 'action') {
      await commandActionRunner(commandRunnerPayload);
    } else if (data.commandType === 'view:json') {
      await commandViewJSONRunner(commandRunnerPayload);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      id: data.workerId,
      message: (error as Error).message,
    });
  }
};
