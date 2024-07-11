import { ExtensionConfigType } from '@altdot/shared';
import { SelectExtensionConfig } from '../../db/schema/extension.schema';
import { ExtensionConfig } from '@altdot/extension/dist/extension-manifest';

export type ExtensionConfigValue = Record<
  string,
  { value: unknown; type: ExtensionConfigType }
>;

export interface ExtensionConfigInsertPayload
  extends Pick<SelectExtensionConfig, 'configId' | 'extensionId'> {
  value: ExtensionConfigValue;
}

export interface ExtensionConfigUpdatePayload {
  value?: ExtensionConfigValue;
}

export type ExtensionConfigModel = Omit<
  SelectExtensionConfig,
  'encryptedValue' | 'id'
>;

export interface ExtensionConfigWithSchemaModel
  extends Pick<SelectExtensionConfig, 'value' | 'configId' | 'extensionId'> {
  commandIcon: string;
  commandTitle: string;
  extensionIcon: string;
  extensionTitle: string;
  config: ExtensionConfig[];
}

export interface ExtensionConfigGetPayload {
  configId: string;
  commandId?: string;
  extensionId: string;
}
