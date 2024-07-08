import { APP_DEEP_LINK_SCHEME } from '@altdot/shared';

export function useNativeApp() {
  function installExtension(extensionId: string) {
    window.open(
      `${APP_DEEP_LINK_SCHEME}://store/extensions/${extensionId}`,
      '_self',
    );
  }
  function installWorkflow(workflowId: string) {
    window.open(
      `${APP_DEEP_LINK_SCHEME}://store/workflows/${workflowId}`,
      '_self',
    );
  }

  return { installExtension, installWorkflow };
}
