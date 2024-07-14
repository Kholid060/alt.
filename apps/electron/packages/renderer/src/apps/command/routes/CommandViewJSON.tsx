import { useEffect, useRef, useState } from 'react';
import { useCommandRoute } from '/@/hooks/useCommandRoute';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import { CommandJSONViews } from '@altdot/extension';
import CommandViewJSONText from '/@/components/command-view-json/CommandViewJSONText';
import CommandViewJSONList from '/@/components/command-view-json/CommandViewJSONList';
import { CommandViewJSONProvider } from '/@/context/command-view-json.context';
import { ExtensionCommandJSONViewData } from '#common/interface/extension.interface';
import { MessagePortCommandJSONUpdateUI } from '#packages/common/interface/message-port-events.interface';
import preloadAPI from '/@/utils/preloadAPI';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { debounce } from '@altdot/shared';

const componentsMap = {
  text: CommandViewJSONText,
  list: CommandViewJSONList,
};

function CommandViewJSON() {
  const { runnerMessagePort } = useCommandCtx();
  const setPanelHeader = useCommandPanelStore.use.setHeader();
  const activeRoute = useCommandRoute((state) => state.currentRoute);

  const runnerId = useRef('');
  const [viewData, setViewData] = useState<CommandJSONViews | null>(null);

  const commandExecutePayload =
    activeRoute?.data as ExtensionCommandJSONViewData;

  useEffect(() => {
    const { commandId, extensionId, icon, subtitle, title } =
      commandExecutePayload;

    setPanelHeader({ title, subtitle, icon });
    // runnerId.current = commandExecutePayload.runnerId;

    const messagePort = runnerMessagePort.current;
    const onUpdateUI = debounce((data: MessagePortCommandJSONUpdateUI) => {
      if (data.commandId !== commandId || data.extensionId !== extensionId) {
        return;
      }

      runnerId.current = data.runnerId;
      setViewData(data.viewData);
    }, 100);
    messagePort?.eventSync.on('command-json:update-ui', onUpdateUI);

    return () => {
      messagePort?.eventSync.off('command-json:update-ui', onUpdateUI);
      preloadAPI.main.ipc.send(
        'extension:stop-execute-command',
        runnerId.current,
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
