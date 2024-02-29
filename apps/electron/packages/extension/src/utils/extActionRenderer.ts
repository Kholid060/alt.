import type { ExtensionRenderer } from '../interfaces/ext-renderer';
import { MODULE_MAP } from './constant';

const extActionRenderer: ExtensionRenderer = async (messagePort) => {
  const { default: renderer } = (await import(MODULE_MAP.renderer)) as {
    default: () => void | Promise<void>;
  };
  await renderer();

  messagePort.sendMessage('extension:finish-execute');
};

export default extActionRenderer;
