export declare namespace Notifications {
  interface NotificationOptions {
    title: string;
    body?: string;
    silent?: boolean;
  }

  interface Static {
    create(options: NotificationOptions): Promise<boolean>;
  }
}
