import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/store/')({
  beforeLoad() {
    throw redirect({
      to: '/store/extensions',
      search: { sortBy: 'recently-added' },
    });
  },
  component: () => null,
});
