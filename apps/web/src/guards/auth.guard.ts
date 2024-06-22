import { AppRouteGuardFunc } from '@/interface/app.interface';
import { UserProfile } from '@/interface/user.interface';
import { redirect } from '@tanstack/react-router';

function hasNoUsername(profile: UserProfile) {
  return !profile.username && window.location.pathname !== '/settings/profile';
}

export const authGuard: AppRouteGuardFunc = ({ context }) => {
  if (!context.userProfile) {
    throw redirect({
      to: '/auth',
    });
  }
  if (hasNoUsername(context.userProfile)) {
    throw redirect({
      to: '/settings/profile',
      search: {
        username: true,
      },
    });
  }
};

export const noAuthGuard: AppRouteGuardFunc = ({ context }) => {
  if (!context.userProfile) return true;

  if (hasNoUsername(context.userProfile)) {
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
