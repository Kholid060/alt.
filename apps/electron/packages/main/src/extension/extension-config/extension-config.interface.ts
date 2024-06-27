import { ExtensionConfigType } from '@alt-dot/shared';
import { SelectExtensionConfig } from '/@/db/schema/extension.schema';
import { ExtensionConfig } from '@alt-dot/extension-core';

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
