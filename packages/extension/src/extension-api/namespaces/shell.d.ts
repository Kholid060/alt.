export declare namespace Shell {
  interface Static {
    moveToTrash(path: string | string[]): Promise<void>;

    showItemInFolder(path: string): Promise<void>;

    openURL(url: string): Promise<void>;

    installedApps: InstalledApps.Static;
  }
}

export declare namespace Shell.InstalledApps {
  interface AppDetail {
    name: string;
    appId: string;
    icon?: string;
    description?: string;
  }

  interface Static {
    query(
      query:
        | `startsWith:${string}`
        | `endsWith:${string}`
        | `exact:${string}`
        | string
        | RegExp,
    ): Promise<AppDetail[]>;

    showInFolder(appId: string): Promise<void>;

    launch(appId: string): Promise<boolean>;

    // @ext-api-value
    getIconURL(appId: string): string;
  }
}
