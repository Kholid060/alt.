import { APP_DEEP_LINK_SCHEME } from '@altdot/shared';
import { APP_DEEP_LINK_HOST } from './constant/app.const';

class DeepLinkURL {
  static getExtensionCommand(extensionId: string, commandId: string) {
    return `${APP_DEEP_LINK_SCHEME}://${APP_DEEP_LINK_HOST.extension}/${extensionId}/${commandId}`;
  }

  static getWorkflow(workflowId: string) {
    return `${APP_DEEP_LINK_SCHEME}://${APP_DEEP_LINK_HOST.workflow}/${workflowId}`;
  }
}

export default DeepLinkURL;
