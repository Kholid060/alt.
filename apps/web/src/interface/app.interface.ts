import { QueryClient } from '@tanstack/react-query';
import { UserProfile } from './user.interface';
import { ParsedLocation } from '@tanstack/react-router';

export interface AppRouterContext {
  queryClient: QueryClient;
  userProfile: null | UserProfile;
}

export interface AppRouteGuardParams {
  location: ParsedLocation;
  context: AppRouterContext;
  search: Record<string, unknown>;
  params: Record<string, string>;
}
export type AppRouteGuardFunc = (
  opts: AppRouteGuardParams,
) => unknown | Promise<unknown>;
