import { memo, useEffect, useRef } from 'react';
import { EXTENSION_VIEW } from '#common/utils/constant/constant';
import { ExtensionCommand } from '@repo/extension-core';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import { useCommandStore } from '/@/stores/command.store';

function CommandSandboxContent({
  type,
  commandId,
  extensionId,
  onFinishExecute,
}: {
  commandId: string;
  extensionId: string;
  onFinishExecute?: () => void;
  type: ExtensionCommand['type'];
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const messageChannelRef = useRef<MessageChannel | null>(null);

  const commandCtx = useCommandCtx();
  const setCommandState = useCommandStore((state) => state.setState);

  const isView = type.startsWith('view');

  function initPortListener(port: MessagePort) {
    commandCtx.setExtMessagePort(port);
    const messagePort = commandCtx.extMessagePort.current!;

    messagePort.addListener('extension:finish-execute', () => {
      onFinishExecute?.();

      const currentPaths = useCommandStore.getState().paths;
      if (currentPaths.length === 0) return;

      currentPaths.pop();

      setCommandState('paths', currentPaths);
    });
  }
  async function onIframeLoad(
    event: React.SyntheticEvent<HTMLIFrameElement, Event>,
  ) {
    try {
      const iframe = event.target as HTMLIFrameElement;
      messageChannelRef.current = new MessageChannel();

      const payload = {
        type: 'init',
        commandType: type,
        themeStyle: '',
      };

      if (isView) {
        payload.themeStyle = (
          await import('@repo/ui/theme.css?inline')
        ).default;
      }

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

  return (
    <iframe
      title="sandbox"
      ref={iframeRef}
      name={EXTENSION_VIEW.frameName}
      src={`extension://${extensionId}/command/${commandId}/`}
      sandbox="allow-scripts"
      className={isView ? 'h-64 block w-full' : 'hidden'}
      onLoad={onIframeLoad}
    />
  );
}

export default memo(CommandSandboxContent);
