import { APP_DEEP_LINK_SCHEME } from '@alt-dot/shared';

export function useNativeApp() {
  function installExtension(extensionId: string) {
    window.open(
      `${APP_DEEP_LINK_SCHEME}://store/extensions/${extensionId}`,
      '_self',
    );
  }

  return { installExtension };
}
