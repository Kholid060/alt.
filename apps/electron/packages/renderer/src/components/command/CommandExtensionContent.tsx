import { useRef } from 'react';
import { EXTENSION_VIEW } from '#common/utils/constant/constant';
import { useCommandCtx } from '/@/hooks/useCommandCtx';

function CommandSandboxContent({
  extensionId,
  commandId,
}: {
  extensionId: string;
  commandId: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const commandCtx = useCommandCtx();

  function onIframeLoad(event: React.SyntheticEvent<HTMLIFrameElement, Event>) {
    const iframe = event.target as HTMLIFrameElement;

    if (!commandCtx.extMessageChannel.current) {
      const messageChannel = new MessageChannel();
      commandCtx.setExtMessageChannel(messageChannel);
    }

    import('@repo/ui/theme.css?inline').then((themeStyle) => {
      const port = commandCtx.extMessageChannel.current?.port2;
      if (!port) throw new Error('Extension MessagePort is undefined');

      iframe.contentWindow?.postMessage(
        {
          type: 'init',
          themeStyle: themeStyle.default,
        },
        '*',
        [port],
      );
    });
  }

  return (
    <iframe
      title="sandbox"
      ref={iframeRef}
      name={EXTENSION_VIEW.frameName}
      src={`extension://${extensionId}/command/${commandId}/`}
      sandbox="allow-scripts"
      className="h-64 block w-full"
      onLoad={onIframeLoad}
    />
  );
}

export default CommandSandboxContent;
