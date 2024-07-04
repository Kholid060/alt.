import { UiIcons } from '@alt-dot/ui';
import clsx from 'clsx';
import { LucideWorkflow } from 'lucide-react';

function WorkflowIcon({
  icon,
  title,
  svgClass,
  className,
}: {
  icon: string;
  title?: string;
  svgClass?: string;
  className?: string;
}) {
  const Icon = UiIcons[icon as keyof typeof UiIcons] ?? LucideWorkflow;

  return (
    <div className="inline-block rounded-md border border-border/40 bg-card p-2 text-muted-foreground">
      <Icon aria-label={title} className={clsx(svgClass, className)} />
    </div>
  );
}

export default WorkflowIcon;
