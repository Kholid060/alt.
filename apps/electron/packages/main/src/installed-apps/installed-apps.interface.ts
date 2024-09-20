export interface InstalledAppDetail
  extends Pick<
    Electron.ShortcutDetails,
    'description' | 'target' | 'icon' | 'iconIndex'
  > {
  name: string;
  path: string;
  isUrlShortcut: boolean;
}
