import type { ExtensionStatus as ExtensionStatusType } from '@/interface/extension.interface';
import { UiPopover, UiPopoverContent, UiPopoverTrigger } from '@alt-dot/ui';
import clsx from 'clsx';
import { FileTextIcon } from 'lucide-react';

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
              'px-3 py-1 rounded-md text-sm flex items-center',
              data.class,
              className,
            )}
            {...props}
          >
            {data.name}
            <hr className="h-4 mx-2 bg-destructive/40 w-px" />
            <FileTextIcon className="size-4" />
          </span>
        </UiPopoverTrigger>
        <UiPopoverContent>
          <h4 className="font-medium leading-none">Rejected reason</h4>
          <div className="bg-background mt-4 rounded-md p-3 whitespace-pre-wrap">
            {rejectReason}
          </div>
        </UiPopoverContent>
      </UiPopover>
    );
  }

  return (
    <span
      className={clsx(
        'px-3 py-1 cursor-default rounded-md text-sm',
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
