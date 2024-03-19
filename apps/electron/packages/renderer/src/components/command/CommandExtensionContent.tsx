import { memo, useEffect, useRef } from 'react';
import { EXTENSION_VIEW } from '#common/utils/constant/constant';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import {
  CommandLaunchContext,
  ExtensionExecutionFinishReason,
} from '@repo/extension';
import { useCommandNavigate, useCommandRoute } from '/@/hooks/useCommandRoute';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { ExtensionCommandViewInitMessage } from '#common/interface/extension.interface';

function CommandSandboxContent({
  onFinishExecute,
}: {
  onFinishExecute?: (
    reason: ExtensionExecutionFinishReason,
    message?: string,
  ) => void;
}) {
  const clearPanelStore = useCommandPanelStore((state) => state.clearAll);

  const navigate = useCommandNavigate();
  const activeRoute = useCommandRoute((state) => state.currentRoute);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const messageChannelRef = useRef<MessageChannel | null>(null);

  const commandCtx = useCommandCtx();

  function initPortListener(port: MessagePort) {
    commandCtx.setExtMessagePort(port);
    const messagePort = commandCtx.extMessagePort.current!;

    messagePort.addListener('extension:finish-execute', (reason, message) => {
      if (onFinishExecute) return onFinishExecute(reason, message);

      clearPanelStore();
      navigate('');
    });
  }
  async function onIframeLoad(
    event: React.SyntheticEvent<HTMLIFrameElement, Event>,
  ) {
    if (!activeRoute?.data) return;

    try {
      const iframe = event.target as HTMLIFrameElement;
      messageChannelRef.current = new MessageChannel();

      const payload: ExtensionCommandViewInitMessage = {
        type: 'init',
        themeStyle: '',
        launchContext: activeRoute.data as CommandLaunchContext,
      };

      payload.themeStyle = (
        await import('@repo/ui/dist/theme.css?inline')
      ).default;

      initPortListener(messageChannelRef.current.port1);

      iframe.contentWindow?.postMessage(payload, '*', [
        messageChannelRef.current.port2,
      ]);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    return () => {
      messageChannelRef.current?.port1.close();
      messageChannelRef.current?.port2.close();

      commandCtx.setExtMessagePort(null);
    };
  }, [commandCtx]);
  useEffect(() => {
    if (!activeRoute?.data) {
      navigate('');
    }
  }, [activeRoute]);

  return (
    <iframe
      title="sandbox"
      ref={iframeRef}
      name={EXTENSION_VIEW.frameName}
      src={`extension://${activeRoute?.params.extensionId}/command/${activeRoute?.params.commandId}/`}
      sandbox="allow-scripts"
      className="h-80 block w-full"
      onLoad={onIframeLoad}
    />
  );
}

export default memo(CommandSandboxContent);
