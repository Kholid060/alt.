import { useEffect, useRef } from 'react';
import { EXTENSION_VIEW } from '#common/utils/constant/constant';

function CommandSandboxContent({ extensionId }: { extensionId: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {

  }, []);

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
