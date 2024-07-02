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
    <div className="p-2 rounded-md border bg-card border-border/40 text-muted-foreground inline-block">
      <Icon aria-label={title} className={clsx(svgClass, className)} />
    </div>
  );
}

export default WorkflowIcon;
