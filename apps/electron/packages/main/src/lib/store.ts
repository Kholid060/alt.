import Store from 'electron-store';

export interface ElectronStore {
  bypassCommands: string[];
}

export const store = new Store<ElectronStore>({
  encryptionKey: Buffer.from(import.meta.env.VITE_STORE_KEY),
});
