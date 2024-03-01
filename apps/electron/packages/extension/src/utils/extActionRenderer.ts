import { ExtensionExecutionFinishReason } from '@repo/extension/dist/interfaces/message-events';
import type { ExtensionRenderer } from '../interfaces/ext-renderer';
import { MODULE_MAP } from './constant';

const EXECUTION_TIMEOUT_MS = 15_000; // 15 seconds

const extActionRenderer: ExtensionRenderer = async (messagePort) => {
  function finishExecution(
    reason: ExtensionExecutionFinishReason,
    message?: string,
  ) {
    messagePort.sendMessage('extension:finish-execute', reason, message);
  }

  try {
    const timeout = setTimeout(() => {
      finishExecution(ExtensionExecutionFinishReason.done);
    }, EXECUTION_TIMEOUT_MS);

    const { default: renderer } = (await import(MODULE_MAP.renderer)) as {
      default: () => void | Promise<void>;
    };
    await renderer();

    clearTimeout(timeout);
    finishExecution(ExtensionExecutionFinishReason.done);
  } catch (error) {
    finishExecution(
      ExtensionExecutionFinishReason.error,
      (error as Error).message,
    );
  }
};

export default extActionRenderer;
