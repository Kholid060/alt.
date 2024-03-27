import { nanoid } from 'nanoid';
import { createStorage, StorageType } from './base';

const browserInfoStorage = createStorage<string>('browser-id', nanoid(), {
  storageType: StorageType.Local,
});

export default browserInfoStorage;
