import { useEffect, useRef } from 'react';
import AMessagePort from '#common/utils/AMessagePort';
import { EXTENSION_VIEW } from '#common/utils/constant/constant';
import { useCommandState } from '@repo/ui';

function CommandSandboxContent({ extensionId }: { extensionId: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const messagePort = useRef<AMessagePort | null>(null);

  const searchQuery = useCommandState((state) => state.search);

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

      window.removeEventListener('message', onMessage);
    }

    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('message', onMessage);
    }
  }, []);
  useEffect(() => {
    if (!messagePort.current) return;

    messagePort.current.sendMessage('extension:query-change', searchQuery);
  }, [searchQuery]);

  return (
    <iframe
      title="sandbox"
      ref={iframeRef}
      name={EXTENSION_VIEW.frameName}
      src={EXTENSION_VIEW.path + `?${EXTENSION_VIEW.idQuery}=${extensionId}`}
      sandbox="allow-scripts"
      className="h-64 block"
    />
  )
}

export default CommandSandboxContent;
