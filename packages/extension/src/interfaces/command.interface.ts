export enum CommandLaunchBy {
  USER = 'user',
  COMMAND = 'command',
  WORKFLOW = 'workflow',
  DEEP_LINK = 'deep-link',
}

export interface CommandLaunchContext<T = Record<string, unknown>> {
  args: T;
  fallbackSearch?: string;
  launchBy: CommandLaunchBy;
}
