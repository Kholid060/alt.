import { useEffect, useRef, useState } from 'react';
import preloadAPI from '../utils/preloadAPI';
import AMessagePort from '#common/utils/AMessagePort';

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
      messagePort.current.addListener('extension:query-change', (value) => {
        console.log('====', value);
      });

      window.top?.postMessage('port', '*', [port2]);
    }
  }, []);

  if (!initExtension) return null;

  return (
    <button>hola</button>
  )
}

export default Extension;
