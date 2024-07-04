import type { ExtensionStatus as ExtensionStatusType } from '@/interface/extension.interface';
import { UiPopover, UiPopoverContent, UiPopoverTrigger } from '@alt-dot/ui';
import clsx from 'clsx';
import { FileTextIcon } from 'lucide-react';
import UiMarkdown from '../ui/UiMarkdown';

const statusData: Record<ExtensionStatusType, { class: string; name: string }> =
  {
    'in-review': {
      name: 'In review',
      class: 'bg-yellow-400/20 text-yellow-400',
    },
    published: {
      name: 'Published',
      class: 'bg-primary/20 text-blue-400',
    },
    rejected: {
      name: 'Rejected',
      class: 'bg-destructive/20 text-destructive-text',
    },
  };

function ExtensionStatus({
  status,
  className,
  rejectReason,
  ...props
}: {
  status: ExtensionStatusType;
  rejectReason?: string | null;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const data = statusData[status];
  if (!data) return null;

  if (status === 'rejected' && rejectReason) {
    return (
      <UiPopover>
        <UiPopoverTrigger>
          <span
            className={clsx(
              'flex items-center rounded-md px-3 py-1 text-sm',
              data.class,
              className,
            )}
            {...props}
          >
            {data.name}
            <hr className="mx-2 h-4 w-px bg-destructive/40" />
            <FileTextIcon className="size-4" />
          </span>
        </UiPopoverTrigger>
        <UiPopoverContent>
          <h4 className="font-medium leading-none">Rejected reason</h4>
          <UiMarkdown
            markdown={rejectReason}
            className="prose-sm mt-4 rounded-md bg-background p-3"
          />
        </UiPopoverContent>
      </UiPopover>
    );
  }

  return (
    <span
      className={clsx(
        'cursor-default rounded-md px-3 py-1 text-sm',
        data.class,
        className,
      )}
      {...props}
    >
      {data.name}
    </span>
  );
}
export default ExtensionStatus;
