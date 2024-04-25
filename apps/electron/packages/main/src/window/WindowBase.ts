abstract class WindowBase {
  abstract createWindow(): Promise<Electron.BrowserWindow>;
}

export default WindowBase;
