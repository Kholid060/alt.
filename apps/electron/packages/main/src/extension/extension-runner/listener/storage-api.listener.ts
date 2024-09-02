import { Injectable } from '@nestjs/common';
import { ExtensionStorageService } from '../../extension-storage/extension-storage.service';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { ExtensionAPI } from '@altdot/extension';

type StorageRecord = Record<string, ExtensionAPI.Storage.Values>;
function storageItemToRecord(
  items: { key: string; value: ExtensionAPI.Storage.Values }[],
) {
  return items.reduce<StorageRecord>((acc, { key, value }) => {
    acc[key] = value;

    return acc;
  }, {});
}

@Injectable()
export class ExtensionStorageApiListener {
  constructor(private extensionStorage: ExtensionStorageService) {}

  @OnExtensionAPI('storage.local.get')
  async localGet({
    args: [keys],
    context: { extensionId },
  }: ExtensionApiEvent<'storage.local.get'>) {
    return this.extensionStorage
      .listItemsByExtensionId({
        extensionId,
        keys: typeof keys === 'string' ? [keys] : keys,
      })
      .then(storageItemToRecord);
  }

  @OnExtensionAPI('storage.local.set')
  async localSet({
    args: [key, value],
    context: { extensionId },
  }: ExtensionApiEvent<'storage.local.set'>) {
    await this.extensionStorage.upsertItems({
      extensionId,
      values: { [key]: value },
    });
  }

  @OnExtensionAPI('storage.local.getAll')
  localGetAll({
    context: { extensionId },
  }: ExtensionApiEvent<'storage.local.getAll'>) {
    return this.extensionStorage
      .listItemsByExtensionId({ extensionId })
      .then(storageItemToRecord);
  }

  @OnExtensionAPI('storage.local.clear')
  async localClear({
    context: { extensionId },
  }: ExtensionApiEvent<'storage.local.clear'>) {
    await this.extensionStorage.deleteItemsByExtensionId({ extensionId });
  }

  @OnExtensionAPI('storage.local.remove')
  async localRemove({
    args: [keys],
    context: { extensionId },
  }: ExtensionApiEvent<'storage.local.remove'>) {
    await this.extensionStorage.deleteItemsByExtensionId({ extensionId, keys });
  }

  @OnExtensionAPI('storage.secure.get')
  async secureGet({
    args: [keys],
    context: { extensionId },
  }: ExtensionApiEvent<'storage.secure.get'>) {
    return this.extensionStorage
      .listItemsByExtensionId({
        extensionId,
        isSecure: true,
        keys: typeof keys === 'string' ? [keys] : keys,
      })
      .then(storageItemToRecord);
  }

  @OnExtensionAPI('storage.secure.set')
  async secureSet({
    args: [key, value],
    context: { extensionId },
  }: ExtensionApiEvent<'storage.secure.set'>) {
    await this.extensionStorage.upsertItems({
      extensionId,
      isSecure: true,
      values: { [key]: value },
    });
  }

  @OnExtensionAPI('storage.secure.remove')
  async secureRemove({
    args: [keys],
    context: { extensionId },
  }: ExtensionApiEvent<'storage.secure.remove'>) {
    await this.extensionStorage.deleteItemsByExtensionId({
      keys,
      extensionId,
      isSecure: true,
    });
  }

  @OnExtensionAPI('storage.secure.getAll')
  secureGetAll({
    context: { extensionId },
  }: ExtensionApiEvent<'storage.secure.getAll'>) {
    return this.extensionStorage
      .listItemsByExtensionId({
        extensionId,
        isSecure: true,
      })
      .then(storageItemToRecord);
  }

  @OnExtensionAPI('storage.secure.clear')
  async secureClear({
    context: { extensionId },
  }: ExtensionApiEvent<'storage.secure.clear'>) {
    await this.extensionStorage.deleteItemsByExtensionId({
      extensionId,
      isSecure: true,
    });
  }
}
