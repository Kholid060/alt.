import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/oauth/redirect')({
  beforeLoad({ context }) {
    if (context.userProfile) {
      throw redirect({
        to: context.userProfile.username ? '/' : '/settings/profile',
      });
    }

    throw redirect({
      to: '/',
    });
  },
  component: () => <p className="my-8 text-center">Redirecting...</p>,
});
