import { useEffect, useRef, useState } from 'react';
import emitter, { MittEventHandler } from '/@/lib/mitt';
import CommandExtensionContent from '../command/CommandExtensionContent';
import createExtensionWorker from '/@/utils/createExtensionWorker';
import preloadAPI from '/@/utils/preloadAPI';

interface CommandExecution {
  timerId: number;
  commandId: string;
  extensionId: string;
}
function AppExtensionSandbox() {
  const [execute, setExecute] = useState<null | CommandExecution>(null);
  const currentWorker = useRef<Worker | null>(null);

  useEffect(() => {
    const onExecuteCommand: MittEventHandler<'execute-command'> = async ({
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
          key: extension.$key,
          manifest: extension.manifest,
          events: {
            onError: (worker, event) => {
              console.error(event);
              clearWorker(worker);
            },
            onFinish: (worker) => clearWorker(worker),
            onMessage: (worker) => clearWorker(worker),
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

  if (!execute) return null;

  return (
    <CommandExtensionContent
      type="action"
      commandId={execute.commandId}
      extensionId={execute.extensionId}
      onFinishExecute={() => setExecute(null)}
    />
  );
}

export default AppExtensionSandbox;
