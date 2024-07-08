import { UiIcons } from '@altdot/ui';
import { LucideProps } from 'lucide-react';

function WorkflowIcon({ icon, ...props }: { icon: string } & LucideProps) {
  const Icon = UiIcons[icon as keyof typeof UiIcons] ?? UiIcons.Workflow;

  return <Icon {...props} />;
}

export default WorkflowIcon;
