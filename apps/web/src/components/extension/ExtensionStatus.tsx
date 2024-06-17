import type { ExtensionStatus as ExtensionStatusType } from '@/interface/extension.interface';
import clsx from 'clsx';

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

function ExtensionStatus({ status }: { status: ExtensionStatusType }) {
  const data = statusData[status];
  if (!data) return null;

  return (
    <span
      className={clsx(
        'px-3 py-1 cursor-default rounded-md text-sm',
        data.class,
      )}
    >
      {data.name}
    </span>
  );
}
export default ExtensionStatus;
