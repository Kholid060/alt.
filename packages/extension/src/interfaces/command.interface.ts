import { CommandJSONViews } from './command-json-view.interface';

export enum CommandLaunchBy {
  USER = 'user',
  WORKFLOW = 'workflow',
  DEEP_LINK = 'deep-link',
}

export interface CommandLaunchContext<T = Record<string, unknown>> {
  args: T;
  fallbackSearch?: string;
  launchBy: CommandLaunchBy;
}

export interface CommandViewJSONLaunchContext<T = Record<string, unknown>>
  extends CommandLaunchContext<T> {
  updateView: (viewData: CommandJSONViews) => void;
}

export type CommandViewJSONRenderer<T = Record<string, unknown>> = (
  launchContext: CommandViewJSONLaunchContext<T>,
) => CommandJSONViews;
