import { useEffect, useRef } from 'react';
import emitter, { MittEventHandler } from '/@/lib/mitt';
import createExtensionWorker from '/@/utils/createExtensionWorker';
import preloadAPI from '/@/utils/preloadAPI';

function AppExtensionSandbox() {
  const currentWorker = useRef<Worker | null>(null);

  useEffect(() => {
    const onExecuteCommand: MittEventHandler<'execute-command'> = async ({
      args = {},
      commandId,
      extensionId,
    }) => {
      try {
        const extension = await preloadAPI.main.sendIpcMessage(
          'extension:get',
          extensionId,
        );
        if (!extension) return;
        if ('$isError' in extension) throw new Error(extension.message);

        const clearWorker = (worker?: Worker) => {
          console.log('CLEAR WORKER');

          worker?.terminate();

          preloadAPI.main.deleteMainMessagePort();
          currentWorker.current?.terminate();
          currentWorker.current = null;
        };

        const extensionWorker = await createExtensionWorker({
          commandId,
          extensionId,
          commandArgs: args,
          key: extension.$key,
          manifest: extension.manifest,
          events: {
            onError: (worker, event) => {
              console.error(event);
              clearWorker(worker);
            },
            onFinish: (worker) => clearWorker(worker),
          },
        });
        if (!extensionWorker) return;

        currentWorker.current = extensionWorker;
      } catch (error) {
        console.error(error);
      }
    };

    emitter.on('execute-command', onExecuteCommand);

    return () => {
      emitter.off('execute-command', onExecuteCommand);
    };
  }, []);

  return null;
}

export default AppExtensionSandbox;
