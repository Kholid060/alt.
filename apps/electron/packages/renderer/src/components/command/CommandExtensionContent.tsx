import { memo, useEffect, useRef } from 'react';
import { EXTENSION_VIEW } from '#common/utils/constant/constant';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import { ExtensionExecutionFinishReason } from '@repo/extension';
import { useShallow } from 'zustand/react/shallow';
import { useCommandStore } from '/@/stores/command.store';
import { useCommandRoute } from '/@/hooks/useCommandRoute';

function CommandSandboxContent({
  onFinishExecute,
}: {
  onFinishExecute?: (
    reason: ExtensionExecutionFinishReason,
    message?: string,
  ) => void;
}) {
  const [breadcrumbs, setCommandStore] = useCommandStore(
    useShallow((state) => [state.breadcrumbs, state.setState]),
  );

  const [navigate, activeRoute] = useCommandRoute((state) => [
    state.navigate,
    state.currentRoute,
  ]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const messageChannelRef = useRef<MessageChannel | null>(null);

  const commandCtx = useCommandCtx();

  function initPortListener(port: MessagePort) {
    commandCtx.setExtMessagePort(port);
    const messagePort = commandCtx.extMessagePort.current!;

    messagePort.addListener('extension:finish-execute', (reason, message) => {
      if (onFinishExecute) return onFinishExecute(reason, message);

      const copyBreadcrumbs = [...breadcrumbs];
      copyBreadcrumbs.pop();

      const lastPath = copyBreadcrumbs.at(-1)?.path ?? '';

      setCommandStore('breadcrumbs', copyBreadcrumbs);
      navigate(lastPath);
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
        themeStyle: '',
        commandArgs: activeRoute?.data ?? {},
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

  return (
    <iframe
      title="sandbox"
      ref={iframeRef}
      name={EXTENSION_VIEW.frameName}
      src={`extension://${activeRoute?.params.extensionId}/command/${activeRoute?.params.commandId}/`}
      sandbox="allow-scripts"
      className="h-64 block w-full"
      onLoad={onIframeLoad}
    />
  );
}

export default memo(CommandSandboxContent);
