import {
  CommandLaunchBy,
  CommandLaunchContext,
  ExtensionAPI,
} from '@altdot/extension';
import { CommandJSONView } from '@altdot/extension/dist/validation/command-json.validation';
import { ExtensionCommandModel } from '../../main/src/extension/extension-command/extension-command.interface';
import {
  EXTENSION_CONFIG_TYPE,
  EXTENSION_PERMISSIONS,
  ExtensionCommandType,
} from '@altdot/shared';
import { AppTheme } from './app.interface';

export type ExtensionConfigType = (typeof EXTENSION_CONFIG_TYPE)[number];
export type ExtensionPermissions = (typeof EXTENSION_PERMISSIONS)[number];

export interface ExtensionCommandViewActionPayload {
  filePath: string;
}

export interface ExtensionCommandViewInitMessage {
  type: 'init';
  theme: AppTheme;
  themeStyle: string;
  payload: ExtensionCommandViewExecutePayload;
}

export interface ExtensionConfigData {
  id: number;
  configId: string;
  extensionId: string;
  value: Record<string, unknown>;
}

export interface ExtensionCommandExecuteScriptOptions {
  captureAllMessages?: boolean;
}
export interface ExtensionCommandExecutePayload {
  commandId: string;
  timeoutMs?: number;
  extensionId: string;
  launchContext: CommandLaunchContext;
  browserCtx?: ExtensionBrowserTabContext;
  scriptOptions?: ExtensionCommandExecuteScriptOptions;
}

export interface ExtensionCommandJSONViewData {
  view: CommandJSONView;
  detail: {
    title: string;
    icon: string;
    subtitle: string;
    commandId: string;
    extensionId: string;
  };
}

export interface ExtensionCommandExecutePayloadWithData
  extends ExtensionCommandExecutePayload {
  commandFilePath: string;
  command: ExtensionCommandModel;
  platform: ExtensionAPI.Runtime.PlatformInfo;
}

export type ExtensionNeedConfigInput = 'extension' | 'command' | false;

export type ExtensionBrowserTabContext = {
  url: string;
  title: string;
  tabId: number;
  browserId: string;
} | null;

export interface ExtensionAPIMessagePayload {
  key: string;
  name: string;
  args: unknown[];
  commandId: string;
  browserCtx: ExtensionBrowserTabContext;
  sender: Electron.IpcMainInvokeEvent | null;
}

export interface ExtensionCommandProcess {
  icon: string;
  title: string;
  runnerId: string;
  commandId: string;
  extensionId: string;
  extensionTitle: string;
  launchBy: CommandLaunchBy;
  type: ExtensionCommandType;
}

export interface ExtensionCommandViewExecutePayload
  extends ExtensionCommandExecutePayloadWithData {
  runnerId: string;
}

export interface ExtensionCommandMetadata {
  scriptHasView?: boolean;
}
