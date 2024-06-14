import { UserProfile } from '@/interface/user.interface';
import { useUserStore } from '@/stores/user.store';
import { Navigate } from 'react-router-dom';

function hasNoUsername(profile: UserProfile) {
  return !profile.username && window.location.pathname !== '/settings/profile';
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
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

  if (hasNoUsername(profile)) {
    return <Navigate to="/settings/profile?username=true" />;
  }

  return children;
}

export function NoAuthGuard({ children }: { children: React.ReactNode }) {
  const profile = useUserStore.use.profile();

  if (!profile) return children;
  if (hasNoUsername(profile)) {
    return <Navigate to="/settings/profile?username=true" />;
  }

  return <Navigate to="/" />;
}
