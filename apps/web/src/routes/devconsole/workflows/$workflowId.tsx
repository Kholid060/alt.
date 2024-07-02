import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/devconsole/workflows/$workflowId')({
  component: () => <div>Hello /devconsole/workflows/$workflowId!</div>,
});
