import { ExtensionError } from '#packages/common/errors/custom-errors';
import type { AllButLast, WSAckErrorResult } from '@repo/shared';
import { isObject, type ExtensionWSServerToClientEvents } from '@repo/shared';
import ExtensionWSNamespace from '/@/services/websocket/ws-namespaces/extensions.ws-namespace';
import type { AllButFirstOrLast, Last } from '@repo/shared';
import type { ExtensionBrowserTabContext } from '#packages/common/interface/extension.interface';

type ElementHandlerWSEventMap = typeof elementHandlerWSEventMap;

const elementHandlerWSEventMap = {
  type: 'tabs:type',
  click: 'tabs:click',
  press: 'tabs:press',
  keyUp: 'tabs:key-up',
  select: 'tabs:select',
  getText: 'tabs:get-text',
  getHTML: 'tabs:get-html',
  keyDown: 'tabs:key-down',
  getAttributes: 'tabs:get-attributes',
} as const;

export function isWSAckError(result: unknown): result is WSAckErrorResult {
  return Boolean(result) && isObject(result) && 'error' in result;
}

export async function extensionBrowserElementHandle<
  T extends keyof ElementHandlerWSEventMap,
  P extends Parameters<
    ExtensionWSServerToClientEvents[ElementHandlerWSEventMap[T]]
  >,
>(
  browserCtx: ExtensionBrowserTabContext,
  name: T,
  ...args: AllButFirstOrLast<P>
) {
  if (!browserCtx) {
    throw new Error("Couldn't find active tab browser");
  }

  const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck({
    browserId: browserCtx.browserId,
    name: elementHandlerWSEventMap[name],
    args: [
      { tabId: browserCtx.id, windowId: browserCtx.windowId },
      ...args,
    ] as unknown as AllButLast<P>,
  });
  if (isWSAckError(result)) {
    throw new ExtensionError(result.errorMessage);
  }

  return result as Exclude<Parameters<Last<P>>[0], WSAckErrorResult>;
}
