import { AppRouteGuardFunc } from '@/interface/app.interface';
import { UserProfile } from '@/interface/user.interface';
import { ParsedLocation, redirect } from '@tanstack/react-router';

function hasNoUsername(profile: UserProfile, location: ParsedLocation) {
  return !profile.username && location.pathname !== '/settings/profile';
}

export const authGuard: AppRouteGuardFunc = ({ context, location }) => {
  if (!context.userProfile) {
    throw redirect({
      to: '/auth',
    });
  }
  if (hasNoUsername(context.userProfile, location)) {
    throw redirect({
      to: '/settings/profile',
      search: {
        username: true,
      },
    });
  }
};

export const noAuthGuard: AppRouteGuardFunc = ({ context, location }) => {
  if (!context.userProfile) return true;

  if (hasNoUsername(context.userProfile, location)) {
    throw redirect({
      to: '/settings/profile',
      search: {
        username: true,
      },
    });
  }

  throw redirect({
    to: '/',
  });
};
