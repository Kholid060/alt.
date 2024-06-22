import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_store/store/workflows')({
  component: () => <div>Hello /_store/store/workflows!</div>,
});
