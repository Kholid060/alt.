import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/store/workflows/$workflowId')({
  component: () => <div>Hello /store/workflows/$workflowId!</div>,
});
