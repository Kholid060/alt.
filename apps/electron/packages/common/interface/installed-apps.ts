import type Electron from 'electron';

export interface InstalledAppDetail extends Pick<Electron.ShortcutDetails, 'description' | 'target' | 'icon' | 'iconIndex'> {
  name: string;
}

export interface PublicInstalledAppDetail extends Omit<InstalledAppDetail, 'target' | 'iconIndex'> {
  appId: string;
}
