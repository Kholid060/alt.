import { useEffect, useRef, useState } from 'react';
import { useCommandNavigate, useCommandRoute } from '/@/hooks/useCommandRoute';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import ExtensionWorker from '/@/utils/extension/ExtensionWorker';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { useShallow } from 'zustand/react/shallow';
import { useCommandStore } from '/@/stores/command.store';
import preloadAPI from '/@/utils/preloadAPI';
import { CommandJSONViews, CommandLaunchContext } from '@repo/extension';
import CommandViewJSONText from '/@/components/command-view-json/CommandViewJSONText';
import CommandViewJSONList from '/@/components/command-view-json/CommandViewJSONList';
import { CommandViewJSONProvider } from '/@/context/command-view-json.context';
import { ExtensionDataValid } from '#common/interface/extension.interface';

const componentsMap = {
  text: CommandViewJSONText,
  list: CommandViewJSONList,
};

function CommandViewJSON() {
  const activeRoute = useCommandRoute((state) => state.currentRoute);
  const addExtensionError = useCommandStore.use.addExtensionError();
  const [addStatus, clearPanel] = useCommandPanelStore(
    useShallow((state) => [state.addStatus, state.clearAll]),
  );

  const navigate = useCommandNavigate();
  const { setExtMessagePort } = useCommandCtx();

  const isExecuting = useRef(false);
  const worker = useRef<Worker | null>(null);

  const [viewData, setViewData] = useState<CommandJSONViews | null>(null);
  const [extension, setExtension] = useState<
    (ExtensionDataValid & { $key: string }) | null
  >(null);

  useEffect(() => {
    let messagePorts: MessagePort[] = [];

    const returnToMainPage = () => {
      navigate('', { panelHeader: null });
    };
    const executeCommand = async () => {
      if (!activeRoute) {
        returnToMainPage();
        return;
      }

      if (isExecuting.current) return;
      isExecuting.current = true;

      const { commandId, extensionId } = activeRoute.params as {
        commandId: string;
        extensionId: string;
      };
      const extension = await preloadAPI.main.invokeIpcMessage(
        'extension:get',
        extensionId,
      );
      if (!extension || '$isError' in extension || extension.isError) {
        returnToMainPage();
        return;
      }

      setExtension(extension);

      const command = extension.manifest.commands.find(
        (command) => command.name === commandId,
      );
      if (!command) {
        returnToMainPage();
        return;
      }

      const { port1, port2 } = new MessageChannel();
      setExtMessagePort(port2);

      messagePorts = [port1, port2];

      port2.addEventListener(
        'message',
        (
          event: MessageEvent<{
            type: 'view-data';
            viewData: CommandJSONViews;
          }>,
        ) => {
          if (!event.data || event.data.type !== 'view-data') return;

          setViewData(event.data.viewData);
        },
      );
      port2.start();

      worker.current = await ExtensionWorker.instance.createWorker({
        command,
        messagePort: port1,
        key: extension.$key,
        extensionId: extension.id,
        manifest: extension.manifest,
        launchContext: activeRoute.data as CommandLaunchContext,
        events: {
          onError: (worker, event) => {
            worker.terminate();
            preloadAPI.main.deleteMainMessagePort();

            if (!event.message) {
              clearPanel();
              return;
            }

            addStatus({
              type: 'error',
              title: 'Error!',
              description: event.message,
              onClose() {
                clearPanel();
              },
            });
            addExtensionError(extension.id, {
              content: event.message,
              title: `Error in "${command.title}" command`,
            });
          },
        },
      });
    };
    executeCommand();

    return () => {
      messagePorts.forEach((port) => port.close());
    };
  }, [activeRoute]);
  useEffect(() => {
    return () => {
      worker.current?.terminate();
      preloadAPI.main.deleteMainMessagePort();
    };
  }, []);

  if (!viewData) return null;

  const Component = componentsMap[viewData.type];

  return (
    <CommandViewJSONProvider
      extension={extension}
      commandId={activeRoute?.params.commandId as string}
    >
      <Component data={viewData as never} />
    </CommandViewJSONProvider>
  );
}

export default CommandViewJSON;
