import { ExtensionCommandViewActionPayload } from '#packages/common/interface/extension.interface';
import { BetterMessagePort, isObject } from '@altdot/shared';

process.parentPort.once('message', async ({ data, ports }) => {
  let port: Electron.MessagePortMain | null = null;

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

    const payload = data.payload as ExtensionCommandViewActionPayload;
    port = ports[0];

    Error.prepareStackTrace = (err) => {
      if (!err.stack) return err.stack;
      return err.stack.split('\n').slice(0, -3).join('\n');
    };

    Object.defineProperties(global, {
      self: {
        value: global,
        writable: false,
        enumerable: false,
        configurable: false,
      },
      _extension: {
        value: {
          viewAction: new BetterMessagePort(port),
        },
        writable: false,
        enumerable: false,
        configurable: false,
      },
    });

    await import(`file://${payload.filePath}`);
  } catch (error) {
    console.error(error);
    port?.postMessage({
      type: '$console',
      level: 'error',
      args: [(error as Error).message],
    });
  }
});
