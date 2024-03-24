import extensionApiBuilder from '@repo/extension-core/dist/extensionApiBuilder';
import ExtensionWorkerMessagePort from '../utils/extension/ExtensionWorkerMessagePort';
import {
  CUSTOM_SCHEME,
  PRELOAD_API_KEY,
} from '#common/utils/constant/constant';
import { ExtensionManifest } from '@repo/extension-core';
import { CommandWorkerInitMessage } from '../interface/command.interface';
import { CommandLaunchContext } from '@repo/extension';

type ExtensionCommand = (payload: CommandLaunchContext) => void | Promise<void>;

async function loadExtensionCommand(extensionId: string, commandId: string) {
  const filePath = `${CUSTOM_SCHEME.extension}://${extensionId}/command/${commandId}/@renderer`;
  const { default: executeCommand } = (await import(
    /* @vite-ignore */ filePath
  )) as {
    default: ExtensionCommand;
  };

  return executeCommand;
}

function initExtensionAPI({
  key,
  port,
  manifest,
  commandId,
}: {
  key: string;
  commandId: string;
  port: MessagePort;
  manifest: ExtensionManifest;
}) {
  const extensionWorkerMessage = new ExtensionWorkerMessagePort({
    key: key,
    commandId,
    messagePort: port,
  });

  const extensionAPI = Object.freeze(
    extensionApiBuilder({
      values: {
        manifest: manifest,
        'ui.searchPanel.onChanged': {
          addListener() {},
          removeListener() {},
        },
        'ui.searchPanel.onKeydown': {
          addListener() {},
          removeListener() {},
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

    const executeCommand = await loadExtensionCommand(extensionId, commandId);
    if (typeof executeCommand !== 'function') {
      throw new Error('The extension command is not a function');
    }

    self.onmessage = null;

    initExtensionAPI({
      commandId,
      key: data.key,
      port: ports[0],
      manifest: data.manifest,
    });

    await executeCommand(data.launchContext);

    self.postMessage({ type: 'finish', id: data.workerId });
  } catch (error) {
    self.postMessage({
      type: 'error',
      id: data.workerId,
      message: (error as Error).message,
    });
  } finally {
    self.close();
  }
};
