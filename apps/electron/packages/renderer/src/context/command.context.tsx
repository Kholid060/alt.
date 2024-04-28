import { RefObject, createContext, useEffect, useRef } from 'react';
import { AMessagePort } from '@repo/shared';
import { ExtensionMessagePortEvent } from '@repo/extension';
import { useCommandPanelStore } from '../stores/command-panel.store';
import preloadAPI from '../utils/preloadAPI';
import { DatabaseExtensionCommandWithExtension } from '#packages/main/src/interface/database.interface';
import { getExtIconURL, isIPCEventError } from '../utils/helper';
import { useCommandNavigate } from '../hooks/useCommandRoute';
import ExtensionCommandActionRunner, {
  CommandActionRunnerListener,
} from '../utils/extension/ExtensionCommandActionRunner';
import { useCommandStore } from '../stores/command.store';
import { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';
import { MESSAGE_PORT_CHANNEL_IDS } from '#packages/common/utils/constant/constant';
import {
  MessagePortListener,
  MessagePortRenderer,
} from '../utils/message-port';
import { MessagePortSharedCommandWindowEvents } from '#packages/common/interface/message-port-events.interface';

export interface CommandContextState {
  executeCommand(payload: ExtensionCommandExecutePayload): void;
  runnerMessagePort: RefObject<
    MessagePortRenderer<MessagePortSharedCommandWindowEvents>
  >;
}

export const CommandContext = createContext<CommandContextState>({
  executeCommand() {},
  runnerMessagePort: { current: null },
});

export function CommandCtxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const clearAllPanel = useCommandPanelStore.use.clearAll();
  const setPanelHeader = useCommandPanelStore.use.setHeader();
  const addPanelStatus = useCommandPanelStore.use.addStatus();
  const removePanelStatus = useCommandPanelStore.use.removeStatus();

  const setCommandStore = useCommandStore.use.setState();
  const addExtensionError = useCommandStore.use.addExtensionError();

  const navigate = useCommandNavigate();

  const runnerMessagePort = useRef<
    MessagePortRenderer<MessagePortSharedCommandWindowEvents>
  >(new MessagePortRenderer());

  function setExtMessagePort(port: MessagePort | null) {
    if (!port && runnerMessagePort.current) {
      runnerMessagePort.current.destroy();
    }

    runnerMessagePort.current = port ? new AMessagePort(port) : port;
    if (!runnerMessagePort.current) return;

    runnerMessagePort.current.addListener(
      'extension:show-toast',
      (toastId, options) => {
        addPanelStatus({
          name: toastId,
          ...options,
        });
      },
    );
    runnerMessagePort.current.addListener('extension:hide-toast', (toastId) => {
      removePanelStatus(toastId);
    });
  }
  async function checkCommandConfig(
    payload: ExtensionCommandExecutePayload,
    command: DatabaseExtensionCommandWithExtension,
  ) {
    if (!command.config || command.config.length === 0) return true;

    const configState = await preloadAPI.main.ipc.invoke(
      'extension-config:need-input',
      payload.extensionId,
      command.name,
    );
    if (isIPCEventError(configState)) {
      addPanelStatus({
        type: 'error',
        title: configState.message,
      });
      return false;
    }

    if (configState.requireInput) {
      const isCommand = configState.type === 'command';
      const configId = isCommand
        ? `${command.extension.id}:${command.name}`
        : command.extension.id;
      navigate(`/configs/${configId}`, {
        panelHeader: {
          subtitle: isCommand ? command.extension.title : '',
          icon: getExtIconURL(
            command.icon || command.extension.icon,
            payload.extensionId,
          ),
          title: isCommand ? command.title : command.extension.title,
        },
        data: {
          executeCommand: payload,
          config: configState.config,
        },
      });

      return false;
    }

    return true;
  }
  async function executeActionCommand(
    payload: ExtensionCommandExecutePayload,
    _command: DatabaseExtensionCommandWithExtension,
  ) {
    const manifest = await preloadAPI.main.ipc.invoke(
      'database:get-extension-manifest',
      payload.extensionId,
    );
    if (!manifest || isIPCEventError(manifest)) {
      addPanelStatus({
        type: 'error',
        title: "Couldn't the extension manifest",
      });
      return;
    }

    const { port1, port2 } = new MessageChannel();
    setExtMessagePort(port2);

    await ExtensionCommandActionRunner.instance.execute({
      payload,
      manifest,
      messagePort: port1,
    });
  }
  async function executeCommand(payload: ExtensionCommandExecutePayload) {
    preloadAPI.main.ipc.send('command:execute', payload);
    return;
    const command = await preloadAPI.main.ipc.invoke(
      'database:get-command',
      payload,
    );
    if (!command || isIPCEventError(command)) {
      addPanelStatus({
        type: 'error',
        title: !command ? "Couldn't find command data" : command.message,
      });
      return;
    }

    const isConfigInputted = await checkCommandConfig(payload, command);
    if (!isConfigInputted) {
      await preloadAPI.main.ipc.invoke('app:show-command-window');
      return;
    }

    const updatePanelHeader = () => {
      setPanelHeader({
        title: command.title,
        subtitle: command.extension.title,
        icon: getExtIconURL(
          command.icon ?? command.extension.icon,
          command.extension.id,
        ),
      });
      removePanelStatus('command-missing-args');
    };

    if (command.type !== 'script') {
      await preloadAPI.main.ipc.invoke('app:show-command-window');
    }

    switch (command.type) {
      case 'action':
        executeActionCommand(payload, command);
        break;
      case 'script': {
        const result = await preloadAPI.main.ipc.invoke(
          'extension:run-script-command',
          payload,
        );
        if ('$isError' in result) {
          addPanelStatus({
            type: 'error',
            title: 'Error!',
            description: result.message,
          });
          return;
        }

        updatePanelHeader();
        break;
      }
      case 'view':
        updatePanelHeader();
        navigate(`/extensions/${command.extension.id}/${command.name}/view`, {
          data: payload,
        });
        break;
      case 'view:json':
        updatePanelHeader();
        navigate(
          `/extensions/${command.extension.id}/${command.name}/view-json`,
          {
            data: payload,
          },
        );
        break;
    }
  }

  useEffect(() => {
    const onCommandActionFinish = () => {
      clearAllPanel();
    };
    const onCommandActionError: CommandActionRunnerListener<'error'> = (
      workerId,
      errorMessage,
    ) => {
      const worker = ExtensionCommandActionRunner.instance.getWorker(workerId);
      if (!worker) return;

      addPanelStatus({
        type: 'error',
        title: 'Error!',
        description: errorMessage,
        onClose() {
          clearAllPanel();
        },
      });

      addExtensionError(worker.payload.extensionId, {
        content: errorMessage,
        title: `Error in "${worker.command.title}" command`,
      });
    };
    ExtensionCommandActionRunner.instance.on('error', onCommandActionError);
    ExtensionCommandActionRunner.instance.on('finish', onCommandActionFinish);

    return () => {
      ExtensionCommandActionRunner.instance.off(
        'finish',
        onCommandActionFinish,
      );
      ExtensionCommandActionRunner.instance.off('error', onCommandActionError);
    };
  }, [clearAllPanel]);
  useEffect(() => {
    const offCommandScriptMessageEvent = preloadAPI.main.ipc.on(
      'command-script:message',
      (_, detail) => {
        switch (detail.type) {
          case 'finish':
          case 'error': {
            const isError = detail.type === 'error';

            if (isError) {
              addExtensionError(detail.extensionId, {
                content: detail.message,
                title: `Error in "${detail.commandTitle}" command`,
              });
            }

            addPanelStatus({
              description: detail.message.slice(
                0,
                detail.message.indexOf('\n'),
              ),
              title: isError ? 'Error!' : 'Script finish running',
              type: isError ? 'error' : 'success',
              onClose() {
                clearAllPanel();
              },
            });
            break;
          }
        }
      },
    );
    const offCommandExecute = preloadAPI.main.ipc.on(
      'command:execute',
      (_, payload) => {
        executeCommand(payload);
      },
    );
    const offOpenExtConfig = preloadAPI.main.ipc.on(
      'extension-config:open',
      (_, payload) => {
        navigate(`/configs/${payload.configId}`, {
          data: payload,
          panelHeader: {
            icon: payload.commandIcon,
            title: payload.commandTitle,
            subtitle: payload.extensionName,
          },
        });
      },
    );
    const offBrowserTabsActive = preloadAPI.main.ipc.on(
      'browser:tabs:active',
      (_, browserTab) => {
        setCommandStore('activeBrowserTab', browserTab);
      },
    );

    preloadAPI.main.ipc.handle('command:execute-action', (payload) => {
      return executeCommand(payload);
    });

    const offSharedMessagePortListener = MessagePortListener.on(
      MESSAGE_PORT_CHANNEL_IDS.sharedWithCommand,
      ({ ports: [port] }) => {
        if (!port) return;

        runnerMessagePort.current.changePort(port);
      },
    );

    return () => {
      offOpenExtConfig();
      offCommandExecute();
      offBrowserTabsActive();
      offSharedMessagePortListener();
      offCommandScriptMessageEvent();
    };
  }, []);

  return (
    <CommandContext.Provider
      value={{
        executeCommand,
        runnerMessagePort,
      }}
    >
      {children}
    </CommandContext.Provider>
  );
}
