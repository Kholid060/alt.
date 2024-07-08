import { UiSkeleton } from '@altdot/ui';
import { useIsFetching } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

/**
 * https://mui.com/material-ui/react-progress/#linear-indeterminate
 */

function AppLoadingIndicator() {
  const router = useRouter();
  const isFetching = useIsFetching();

  const isLoading = isFetching || router.state.isLoading;

  return (
    <div
      className="fixed top-0 z-[999] h-1 w-full bg-primary/20"
      style={
        {
          height: isLoading ? 4 : 0,
          transition: 'height 150ms ease',
          '--play': isLoading ? 'running' : 'unset',
        } as React.CSSProperties
      }
    >
      <span
        className="absolute bottom-0 left-0 top-0 h-full bg-primary/60"
        style={{
          width: 'auto',
          transformOrigin: 'left center',
          transition: 'transform 0.2s linear 0s',
          animation:
            '2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) 0s infinite normal none var(--play) animation-progress-1',
        }}
      />
      <span
        style={{
          width: 'auto',
          transformOrigin: 'left center',
          transition: 'transform 0.2s linear 0s',
          animation:
            '2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite normal none var(--play) animation-progress-2',
        }}
        className="absolute bottom-0 left-0 top-0 h-full bg-primary/60"
      />
    </div>
  );
}

export function AppLoadingPlaceholder() {
  return (
    <div className="container">
      <UiSkeleton className="mt-4 h-12" />
      <UiSkeleton className="mt-24 h-8 max-w-sm" />
      <div className="mt-4 flex flex-col gap-4 md:flex-row">
        <UiSkeleton className="h-48 w-full md:w-64" />
        <UiSkeleton className="h-48 flex-1" />
      </div>
      <UiSkeleton className="mt-4 h-64 w-full" />
    </div>
  );
}

export default AppLoadingIndicator;
