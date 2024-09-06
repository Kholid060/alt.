import { ExtensionCommandExecutePayloadWithData } from '#packages/common/interface/extension.interface';
import { BetterMessagePort, isObject } from '@altdot/shared';
import { createExtensionAPI } from '#common/utils/extension/extension-api-factory';
import ExtensionWorkerMessagePort from '../utils/ExtensionWorkerMessagePort';
import forwardConsole from '/@/common/utils/forward-console';

process.parentPort.once('message', async ({ data, ports }) => {
  try {
    if (
      !ports.length ||
      !isObject(data) ||
      !data.payload ||
      data.type !== 'start'
    ) {
      process.parentPort.postMessage({
        type: 'error',
        message: 'Invalid payload',
      });
      return;
    }

    const payload = data.payload as ExtensionCommandExecutePayloadWithData;
    const messagePort = new ExtensionWorkerMessagePort({
      key: payload.extensionId,
      commandId: payload.commandId,
      browserCtx: payload.browserCtx ?? null,
      messagePort: ports[0],
    });

    Error.prepareStackTrace = (err) => {
      if (!err.stack) return err.stack;

      return err.stack.split('\n').slice(0, -1).join('\n');
    };

    Object.defineProperties(global, {
      self: {
        value: global,
        writable: false,
        enumerable: false,
        configurable: false,
      },
      _extension: {
        writable: false,
        enumerable: false,
        configurable: false,
        value: createExtensionAPI({
          platform: payload.platform,
          browserCtx: payload.browserCtx ?? null,
          messagePort: new BetterMessagePort(ports[1]),
          sendMessage: messagePort.sendMessage.bind(messagePort),
        }),
      },
      console: {
        value: forwardConsole(
          {
            commandTitle: payload.command.title,
            extensionTitle: payload.command.extension.title,
          },
          (consolePayload) => ports[1].postMessage(consolePayload),
        ),
      },
    });

    const { default: commandFunction } = await import(
      `file://${payload.commandFilePath}.js`
    );
    if (!commandFunction || typeof commandFunction !== 'function') {
      throw new Error('Exported command value must be function');
    }

    const value = await commandFunction(payload.launchContext);
    process.parentPort.postMessage({ type: 'finish', value });
  } catch (error) {
    console.error(error);
    process.parentPort.postMessage({
      type: 'error',
      message: (error as Error).message,
    });
  }
});
