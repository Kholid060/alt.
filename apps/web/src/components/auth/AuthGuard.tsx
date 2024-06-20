import { UserProfile } from '@/interface/user.interface';
import { useUserStore } from '@/stores/user.store';
import { UserRole } from '@/utils/constant';
import { PageError } from '@/utils/custom-error';
import { Navigate } from 'react-router-dom';

function hasNoUsername(profile: UserProfile) {
  return !profile.username && window.location.pathname !== '/settings/profile';
}

export function AuthGuard({
  role,
  element: Element,
  ...props
}: {
  role?: UserRole;
  element: React.FC;
}) {
  const profile = useUserStore.use.profile();
  if (!profile) {
    return (
      <Navigate
        to={{
          pathname: '/auth',
          search: `?redirectTo=${window.location.pathname}`,
        }}
      />
    );
  }
  if (role && profile.role !== role) throw new PageError(404, {});

  if (hasNoUsername(profile)) {
    return <Navigate to="/settings/profile?username=true" />;
  }

  return <Element {...props} />;
}

export function NoAuthGuard({
  element: Element,
  ...props
}: {
  element: React.FC;
}) {
  const profile = useUserStore.use.profile();

  if (!profile) return <Element {...props} />;
  if (hasNoUsername(profile)) {
    return <Navigate to="/settings/profile?username=true" />;
  }

  return <Navigate to="/" />;
}
