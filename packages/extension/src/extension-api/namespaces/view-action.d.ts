import { BetterMessagePortAsync, BetterMessagePortSync } from '@altdot/shared';

export declare namespace ViewAction {
  interface Static {
    async: Pick<
      BetterMessagePortAsync<ExtensionViewActionAsyncEvent>,
      'on' | 'off' | 'sendMessage'
    >;
    sync: Pick<
      BetterMessagePortSync<ExtensionViewActionSyncEvent>,
      'on' | 'off' | 'sendMessage'
    >;
  }
}
