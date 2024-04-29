import { useEffect, useRef, useState } from 'react';
import { useCommandRoute } from '/@/hooks/useCommandRoute';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import { CommandJSONViews } from '@repo/extension';
import CommandViewJSONText from '/@/components/command-view-json/CommandViewJSONText';
import CommandViewJSONList from '/@/components/command-view-json/CommandViewJSONList';
import { CommandViewJSONProvider } from '/@/context/command-view-json.context';
import { ExtensionJSONViewData } from '#common/interface/extension.interface';
import { MessagePortCommandJSONUpdateUI } from '#packages/common/interface/message-port-events.interface';
import preloadAPI from '/@/utils/preloadAPI';
import { useCommandPanelStore } from '/@/stores/command-panel.store';

const componentsMap = {
  text: CommandViewJSONText,
  list: CommandViewJSONList,
};

function CommandViewJSON() {
  const { runnerMessagePort } = useCommandCtx();
  const setPanelHeader = useCommandPanelStore.use.setHeader();
  const activeRoute = useCommandRoute((state) => state.currentRoute);

  const processId = useRef('');
  const [viewData, setViewData] = useState<CommandJSONViews | null>(null);

  const commandExecutePayload = activeRoute?.data as ExtensionJSONViewData;

  useEffect(() => {
    const { commandId, extensionId, icon, subtitle, title } =
      commandExecutePayload;

    setPanelHeader({ title, subtitle, icon });
    // processId.current = commandExecutePayload.processId;

    const messagePort = runnerMessagePort.current;
    const onUpdateUI = (data: MessagePortCommandJSONUpdateUI) => {
      if (data.commandId !== commandId || data.extensionId !== extensionId) {
        return;
      }

      processId.current = data.processId;
      setViewData(data.viewData);
    };
    messagePort?.event.on('command-json:update-ui', onUpdateUI);

    return () => {
      messagePort?.event.off('command-json:update-ui', onUpdateUI);
      preloadAPI.main.ipc.send(
        'extension:stop-execute-command',
        processId.current,
      );
    };
  }, [commandExecutePayload, setPanelHeader]);

  if (!viewData) return null;

  const Component = componentsMap[viewData.type];

  return (
    <CommandViewJSONProvider payload={commandExecutePayload}>
      <Component data={viewData as never} />
    </CommandViewJSONProvider>
  );
}

export default CommandViewJSON;
