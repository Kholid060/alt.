/* eslint-disable @typescript-eslint/ban-types */

export declare namespace Shell {
  interface Static {
    showItemInFolder(path: string): Promise<void>;

    openURL(url: string): Promise<void>;

    installedApps: InstalledApps.Static;
  }
}

export declare namespace Shell.InstalledApps {
  interface AppDetail {
    name: string;
    appId: string;
    description?: string;
  }

  interface Static {
    query(
      filter?:
        | `startsWith:${string}`
        | `endsWith:${string}`
        | `exact:${string}`
        | (string & {}),
    ): Promise<AppDetail[]>;

    showInFolder(appId: string): Promise<void>;

    launch(appId: string): Promise<boolean>;

    // @ext-api-value
    getIconURL(appId: string): string;
  }
}
