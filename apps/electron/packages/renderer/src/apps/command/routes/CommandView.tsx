import { memo, useEffect, useRef, useState } from 'react';
import { EXTENSION_VIEW } from '#common/utils/constant/constant';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import { useCommandNavigate, useCommandRoute } from '/@/hooks/useCommandRoute';
import {
  ExtensionCommandExecutePayload,
  ExtensionCommandViewInitMessage,
} from '#common/interface/extension.interface';
import { BetterMessagePort } from '@alt-dot/shared';
import preloadAPI from '/@/utils/preloadAPI';
import { isIPCEventError } from '#packages/common/utils/helper';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { getExtIconURL } from '/@/utils/helper';

function CommandView() {
  const setHeader = useCommandPanelStore.use.setHeader();

  const navigate = useCommandNavigate();
  const activeRoute = useCommandRoute((state) => state.currentRoute);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const messageChannelRef = useRef<MessageChannel | null>(null);

  const commandCtx = useCommandCtx();

  const [show, setShow] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  function initPortListener(port: MessagePort) {
    commandCtx.setCommandViewMessagePort(
      BetterMessagePort.createStandalone('sync', port),
    );
    const messagePort = commandCtx.commandViewMessagePort.current!;

    messagePort.on('extension:reload', () => {
      setIframeKey((prevVal) => prevVal + 1);
    });
  }
  async function onIframeLoad() {
    if (!activeRoute?.data || !iframeRef.current) return;

    try {
      const iframe = iframeRef.current;
      messageChannelRef.current = new MessageChannel();

      const payload: ExtensionCommandViewInitMessage = {
        type: 'init',
        themeStyle: '',
        payload: activeRoute.data as ExtensionCommandExecutePayload,
      };

      payload.themeStyle = (
        await import('@alt-dot/ui/dist/theme.css?inline')
      ).default;

      initPortListener(messageChannelRef.current.port1);

      iframe.contentWindow?.postMessage(payload, '*', [
        messageChannelRef.current.port2,
      ]);

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
    };
  }, [commandCtx]);
  useEffect(() => {
    const data = activeRoute?.data as ExtensionCommandExecutePayload;

    if (!data) {
      navigate('');
    } else {
      setShow(true);
      preloadAPI.main.ipc
        .invoke('database:get-command', {
          commandId: data.commandId,
          extensionId: data.extensionId,
        })
        .then((data) => {
          if (isIPCEventError(data) || !data) return;

          setHeader({
            icon: getExtIconURL(
              data.icon || data.extension.icon,
              data.extensionId,
            ),
            title: data.title,
            subtitle: data.extension.title,
          });
        });
    }

    return () => {
      setHeader(null);
    };
  }, [activeRoute]);

  if (!show) return null;

  return (
    <iframe
      key={iframeKey}
      title="sandbox"
      ref={iframeRef}
      name={EXTENSION_VIEW.frameName}
      src={`extension://${activeRoute?.params.extensionId}/command/${activeRoute?.params.commandId}/`}
      sandbox="allow-scripts"
      className="block h-80 w-full"
      style={{ visibility: 'hidden' }}
      onLoad={onIframeLoad}
    />
  );
}

export default memo(CommandView);
