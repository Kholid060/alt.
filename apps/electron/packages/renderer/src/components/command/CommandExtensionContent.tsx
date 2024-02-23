import { useEffect, useRef } from 'react';
import AMessagePort from '#common/utils/AMessagePort';
import { EXTENSION_VIEW } from '#common/utils/constant/constant';
import { useCommandCtx } from '/@/hooks/useCommandCtx';

function CommandSandboxContent({ extensionId }: { extensionId: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const messagePort = useRef<AMessagePort | null>(null);

  const commandCtx = useCommandCtx();

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      console.log(event);
      if (
        messagePort.current ||
        event.source !== iframeRef.current?.contentWindow ||
        !event.ports[0]
      ) return;

      messagePort.current = new AMessagePort(event.ports[0]);
      messagePort.current.sendMessage('extension:init');

      commandCtx.updateMessagePort(messagePort.current);

      window.removeEventListener('message', onMessage);
    }

    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('message', onMessage);
    }
  }, []);

  return (
    <iframe
      title="sandbox"
      ref={iframeRef}
      name={EXTENSION_VIEW.frameName}
      src={EXTENSION_VIEW.path + `?${EXTENSION_VIEW.idQuery}=${extensionId}`}
      sandbox="allow-scripts"
      className="h-64 block w-full"
    />
  )
}

export default CommandSandboxContent;
