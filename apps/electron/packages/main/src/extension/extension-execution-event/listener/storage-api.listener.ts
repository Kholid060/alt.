import { Injectable } from '@nestjs/common';
import { ExtensionStorageService } from '../../extension-storage/extension-storage.service';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { ExtensionApiEvent } from '../events/extension-api.event';
import ExtensionAPI from '@altdot/extension-core/types/extension-api';

type StorageRecord = Record<string, ExtensionAPI.storage.Values>;
function storageItemToRecord(
  items: { key: string; value: ExtensionAPI.storage.Values }[],
) {
  return items.reduce<StorageRecord>((acc, { key, value }) => {
    acc[key] = value;

    return acc;
  }, {});
}

@Injectable()
export class ExtensionStorageApiListener {
  constructor(private extensionStorage: ExtensionStorageService) {}

  @OnExtensionAPI('storage.get')
  async get({
    args: [keys],
    context: { extensionId },
  }: ExtensionApiEvent<'storage.get'>) {
    return this.extensionStorage
      .listItemsByExtensionId(
        extensionId,
        typeof keys === 'string' ? [keys] : keys,
      )
      .then(storageItemToRecord);
  }

  @OnExtensionAPI('storage.set')
  async set({
    args: [key, value],
    context: { extensionId },
  }: ExtensionApiEvent<'storage.set'>) {
    await this.extensionStorage.upsertItems(extensionId, { [key]: value });
  }

  @OnExtensionAPI('storage.getAll')
  getAll({ context: { extensionId } }: ExtensionApiEvent<'storage.getAll'>) {
    return this.extensionStorage
      .listItemsByExtensionId(extensionId)
      .then(storageItemToRecord);
  }

  @OnExtensionAPI('storage.clear')
  async clear({
    context: { extensionId },
  }: ExtensionApiEvent<'storage.clear'>) {
    await this.extensionStorage.deleteItemsByExtensionId(extensionId);
  }
}
