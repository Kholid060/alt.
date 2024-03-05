import extensionApiBuilder from '@repo/extension-core/dist/extensionApiBuilder';
import ExtensionWorkerMessagePort from '../utils/ExtensionWorkerMessagePort';
import {
  CUSTOM_SCHEME,
  PRELOAD_API_KEY,
} from '#common/utils/constant/constant';
import { ExtensionManifest } from '@repo/extension-core';

type ExtensionCommand = () => void | Promise<void>;

async function loadExtensionCommand() {
  const [extensionId, commandId] = self.name.split(':');
  self.name = '';

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
  manifest,
  port,
}: {
  key: string;
  port: MessagePort;
  manifest: ExtensionManifest;
}) {
  const extensionWorkerMessage = new ExtensionWorkerMessagePort({
    key: key,
    messagePort: port,
    permissions: manifest.permissions ?? [],
  });

  const extensionAPI = Object.freeze(
    extensionApiBuilder({
      values: {
        manifest: manifest,
        'installedApps.getIconURL': (appId) =>
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

self.onmessage = async ({ ports, data }) => {
  try {
    if (!ports.length || data?.type !== 'init' || !data.key || !data.manifest) {
      self.close();
      return;
    }

    const executeCommand = await loadExtensionCommand();
    if (typeof executeCommand !== 'function') {
      throw new Error('The extension command is not a function');
    }

    self.onmessage = null;

    initExtensionAPI({
      key: data.key,
      port: ports[0],
      manifest: data.manifest.permissions,
    });

    await executeCommand();

    self.postMessage('finish');
  } catch (error) {
    console.error(error);
    self.postMessage('error', (error as Error).message);
  } finally {
    self.close();
  }
};