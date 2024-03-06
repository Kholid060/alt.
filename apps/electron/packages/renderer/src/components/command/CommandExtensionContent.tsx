import { memo, useEffect, useRef } from 'react';
import { EXTENSION_VIEW } from '#common/utils/constant/constant';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import { ExtensionExecutionFinishReason } from '@repo/extension';
import { useCommandRouteStore } from '/@/stores/command-route.store';
import { useShallow } from 'zustand/react/shallow';

function CommandSandboxContent({
  onFinishExecute,
}: {
  onFinishExecute?: (
    reason: ExtensionExecutionFinishReason,
    message?: string,
  ) => void;
}) {
  const [parsedPath, breadcrumbs, pathData, navigate] = useCommandRouteStore(
    useShallow((state) => [
      state.parsedPath,
      state.breadcrumbs,
      state.pathData,
      state.navigate,
    ]),
  );

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

      navigate(lastPath, { breadcrumbs: copyBreadcrumbs });
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
        commandArgs: pathData,
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
      src={`extension://${parsedPath.params.extensionId}/command/${parsedPath.params.commandId}/`}
      sandbox="allow-scripts"
      className="h-64 block w-full"
      onLoad={onIframeLoad}
    />
  );
}

export default memo(CommandSandboxContent);
