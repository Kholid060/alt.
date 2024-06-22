import {
  AppRouteGuardFunc,
  AppRouteGuardParams,
} from '@/interface/app.interface';

export async function routeBeforeLoadPipe<T>(
  data: AppRouteGuardParams,
  guards: AppRouteGuardFunc[],
  callback?: () => T,
) {
  for (const guard of guards) {
    await guard(data);
  }

  if (callback) return callback();
}
