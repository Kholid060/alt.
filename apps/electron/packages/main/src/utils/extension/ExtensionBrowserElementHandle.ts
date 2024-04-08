import { ExtensionError } from '#packages/common/errors/custom-errors';
import type { WSAckErrorResult } from '@repo/shared';
import { isObject, type ExtensionWSServerToClientEvents } from '@repo/shared';
import BrowserService from '/@/services/browser.service';
import ExtensionWSNamespace from '/@/services/websocket/ws-namespaces/extensions.ws-namespace';
import type { AllButFirstOrLast, Last } from '@repo/shared';

type ElementHandlerWSEventMap = typeof elementHandlerWSEventMap;

const elementHandlerWSEventMap = {
  type: 'tabs:type',
  click: 'tabs:click',
  press: 'tabs:press',
  keyUp: 'tabs:key-up',
  select: 'tabs:select',
  getText: 'tabs:get-text',
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
>(name: T, ...args: AllButFirstOrLast<P>) {
  const { browserId, id, windowId } = BrowserService.instance.getActiveTab();

  const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck({
    browserId,
    name: elementHandlerWSEventMap[name],
    // @ts-expect-error omitted first and last params
    args: [{ tabId: id, windowId }, ...args],
  });
  if (isWSAckError(result)) {
    throw new ExtensionError(result.errorMessage);
  }

  return result as Exclude<Parameters<Last<P>>[0], WSAckErrorResult>;
}
