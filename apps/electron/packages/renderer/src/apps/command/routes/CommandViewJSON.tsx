import { useEffect, useRef, useState } from 'react';
import { useCommandNavigate, useCommandRoute } from '/@/hooks/useCommandRoute';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import preloadAPI from '/@/utils/preloadAPI';
import { CommandJSONViews } from '@repo/extension';
import CommandViewJSONText from '/@/components/command-view-json/CommandViewJSONText';
import CommandViewJSONList from '/@/components/command-view-json/CommandViewJSONList';
import { CommandViewJSONProvider } from '/@/context/command-view-json.context';
import { ExtensionCommandExecutePayload } from '#common/interface/extension.interface';
import { isIPCEventError } from '/@/utils/helper';
import { ExtensionManifest } from '@repo/extension-core';
import ExtensionCommandActionRunner from '/@/utils/extension/ExtensionCommandActionRunner';

const componentsMap = {
  text: CommandViewJSONText,
  list: CommandViewJSONList,
};

function CommandViewJSON() {
  const activeRoute = useCommandRoute((state) => state.currentRoute);

  const navigate = useCommandNavigate();
  const { setExtMessagePort } = useCommandCtx();

  const workerId = useRef('');
  const isExecuting = useRef(false);

  const [viewData, setViewData] = useState<CommandJSONViews | null>(null);
  const [extensionManifest, setExtensionManifest] =
    useState<ExtensionManifest | null>(null);

  const commandExecutePayload =
    activeRoute?.data as ExtensionCommandExecutePayload;

  useEffect(() => {
    let messagePorts: MessagePort[] = [];

    const returnToMainPage = () => {
      navigate('', { panelHeader: null });
    };
    const executeCommand = async () => {
      if (!commandExecutePayload) {
        returnToMainPage();
        return;
      }

      if (isExecuting.current) return;
      isExecuting.current = true;

      const extensionManifest = await preloadAPI.main.ipc.invoke(
        'database:get-extension-manifest',
        commandExecutePayload.extensionId,
      );
      if (!extensionManifest || isIPCEventError(extensionManifest)) {
        returnToMainPage();
        return;
      }

      const command = extensionManifest.commands.find(
        (command) => command.name === commandExecutePayload.commandId,
      );
      if (!command) {
        returnToMainPage();
        return;
      }

      setExtensionManifest(extensionManifest);

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

      const workerData = await ExtensionCommandActionRunner.instance.execute({
        messagePort: port1,
        manifest: extensionManifest,
        payload: commandExecutePayload,
      });
      if (!workerData) {
        returnToMainPage();
        return;
      }

      workerId.current = workerData.id;
    };
    executeCommand();

    return () => {
      messagePorts.forEach((port) => port.close());
    };
  }, [commandExecutePayload]);
  useEffect(() => {
    return () => {
      ExtensionCommandActionRunner.instance.stopExecution(workerId.current);
    };
  }, []);

  if (!viewData || !extensionManifest) return null;

  const Component = componentsMap[viewData.type];

  return (
    <CommandViewJSONProvider
      payload={commandExecutePayload}
      extensionManifest={extensionManifest}
    >
      <Component data={viewData as never} />
    </CommandViewJSONProvider>
  );
}

export default CommandViewJSON;
