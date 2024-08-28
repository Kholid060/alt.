import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/u/$username/')({
  beforeLoad({ params }) {
    throw redirect({
      params,
      to: '/u/$username/extensions',
    });
  },
  component: () => null,
});
