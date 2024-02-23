import { useEffect, useRef, useState } from 'react';
import preloadAPI from '../utils/preloadAPI';
import AMessagePort from '#common/utils/AMessagePort';
import { ExtensionStateProvider } from '../context/extension.context';
import ExtensionList from '../components/extension/ExtensionList';
import ExtensionIcon from '../components/extension/ExtensionIcon';

function Extension() {
  const messagePort = useRef<AMessagePort | null>(null);

  const [initExtension, setInitExtension] = useState(false);

  useEffect(() => {
    console.log('EXTENSION ', preloadAPI.extension);

    if (!messagePort.current) {
      const { port1, port2 } = new MessageChannel();

      messagePort.current = new AMessagePort(port1);
      messagePort.current.addListener('extension:init', () => {
        setInitExtension(true);
      });

      window.top?.postMessage('port', '*', [port2]);
    }
  }, []);

  if (!initExtension) return null;

  return (
    <ExtensionStateProvider
      messagePort={messagePort.current!}
    >
      <ExtensionList>
        <ExtensionList.Item
          title="lorem"
          value="lorem"
          icon={<ExtensionList.ItemIcon icon={ExtensionIcon.Atom} />}
        />
        <ExtensionList.Item title="ipsum" value="ipsum" icon={<p>test</p>} />
      </ExtensionList>
    </ExtensionStateProvider>
  )
}

export default Extension;
