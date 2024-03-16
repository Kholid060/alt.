import { UiButton } from '@repo/ui';
import { GripHorizontalIcon } from 'lucide-react';

function CommandFooter() {
  return (
    <div className="flex items-center gap-4 mt-1 text-sm bg-background rounded-lg border">
      {import.meta.env.DEV && (
        <UiButton
          size="icon"
          variant="secondary"
          className="mb-2 cursor-move"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <GripHorizontalIcon className="h-5 w-5" />
        </UiButton>
      )}
    </div>
  );
}

export default CommandFooter;
