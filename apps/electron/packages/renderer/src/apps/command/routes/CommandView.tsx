/* eslint-disable react/no-unknown-property */
import { memo, useEffect, useRef, useState } from 'react';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import { useCommandNavigate, useCommandRoute } from '/@/hooks/useCommandRoute';
import {
  ExtensionCommandViewInitMessage,
  ExtensionCommandViewExecutePayload,
} from '#common/interface/extension.interface';
import { sleep } from '@altdot/shared';
import { getExtIconURL } from '/@/utils/helper';
import { useTheme } from '/@/hooks/useTheme';
import { useCommandStore } from '/@/stores/command.store';
import { useCommandPanelHeader } from '/@/hooks/useCommandPanelHeader';

function CommandView() {
  const updateCommandState = useCommandStore.use.setState();

  const theme = useTheme();
  const navigate = useCommandNavigate();
  const activeRoute = useCommandRoute((state) => state.currentRoute);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const messageChannelRef = useRef<MessageChannel | null>(null);

  const commandCtx = useCommandCtx();

  const [iframeKey, setIframeKey] = useState(0);

  const { payload, port } = activeRoute?.data as {
    port: MessagePort;
    payload: ExtensionCommandViewExecutePayload;
  };

  useCommandPanelHeader({
    icon: getExtIconURL(
      payload.command.icon || payload.command.extension.icon,
      payload.extensionId,
    ),
    title: payload.command.title,
    subtitle: payload.command.extension.title,
  });

  async function onIframeLoad() {
    if (!activeRoute?.data || !iframeRef.current) return;

    try {
      const iframe = iframeRef.current;
      messageChannelRef.current = new MessageChannel();

      const iframePayload: ExtensionCommandViewInitMessage = {
        payload,
        type: 'init',
        themeStyle: '',
        theme: theme.theme,
      };

      commandCtx.setCommandViewMessagePort(messageChannelRef.current.port1);
      commandCtx.runnerMessagePort.current.eventSync.on(
        'extension:reload',
        () => {
          setIframeKey((prevVal) => prevVal + 1);
        },
      );
      commandCtx.runnerMessagePort.current.eventSync.on(
        'extension:navigation-toggle-root-lock',
        (lock) => {
          updateCommandState('useCommandViewNavigation', lock);
        },
      );
      commandCtx.runnerMessagePort.current.eventSync.on(
        'extension:finish-execute',
        () => {
          navigate('');
        },
      );

      const portsPayload: MessagePort[] = [messageChannelRef.current.port2];
      if (port) portsPayload.push(port);

      iframe.contentWindow?.postMessage(iframePayload, '*', portsPayload);

      await sleep(200);
      iframe.style.visibility = 'visible';
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    return () => {
      messageChannelRef.current?.port1.close();
      messageChannelRef.current?.port2.close();

      commandCtx.setCommandViewMessagePort(null);
      updateCommandState('useCommandViewNavigation', false);
    };
  }, [commandCtx, updateCommandState]);
  useEffect(() => {
    commandCtx.runnerMessagePort.current.eventSync.sendMessage(
      'app:theme-changed',
      theme.theme,
    );
  }, [commandCtx.runnerMessagePort, theme.theme]);

  if (!payload) {
    navigate('');
    return null;
  }

  return (
    <iframe
      name="extension-page"
      key={iframeKey}
      title="sandbox"
      ref={iframeRef}
      src={`extension://${activeRoute?.params.extensionId}/command/${activeRoute?.params.commandId}/`}
      className="invisible block h-80 w-full"
      onLoad={onIframeLoad}
    />
  );
}

export default memo(CommandView);
