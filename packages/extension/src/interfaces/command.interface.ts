export enum CommandLaunchBy {
  USER = 'user',
  WORKFLOW = 'workflow',
  DEEP_LINK = 'deep-link',
}

export interface CommandLaunchContext<T = Record<string, unknown>> {
  args: T;
  launchBy: CommandLaunchBy;
}
