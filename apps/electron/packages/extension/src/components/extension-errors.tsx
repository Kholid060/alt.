import React from 'react';
import { ExtensionMessagePortEvent } from '@altdot/extension';
import { BetterMessagePortSync } from '@altdot/shared';
import { UiButton } from '@altdot/ui';
import { FallbackProps } from 'react-error-boundary';
import { mapStackTrace } from 'sourcemapped-stacktrace';
import bugFixingSvg from '#common/assets/svg/bug-fixing.svg';

export function ExtensionErrorBoundaryFallback({
  error,
  messagePort,
}: FallbackProps & {
  messagePort: BetterMessagePortSync<ExtensionMessagePortEvent>;
}) {
  const [mappedStack, setMappedStack] = React.useState('');

  React.useEffect(() => {
    mapStackTrace(error.stack, (stackTrace) => {
      setMappedStack(
        error.stack.slice(0, error.stack.indexOf('\n')) +
          '\n' +
          stackTrace.join('\n'),
      );
    });
  }, [error]);

  return (
    <div className="h-full w-full p-4">
      <div className="flex items-start">
        <p className="flex-1 gap-4 font-semibold text-destructive-text">
          {error.message}
        </p>
        <UiButton
          size="sm"
          variant="secondary"
          onClick={() => messagePort.sendMessage('extension:reload')}
        >
          Reload
        </UiButton>
      </div>
      <div className="mt-4 whitespace-pre-wrap rounded-lg bg-card p-4 font-mono text-sm text-muted-foreground">
        {mappedStack}
      </div>
    </div>
  );
}

export function ExtensionErrorNotFound() {
  return (
    <div className="h-full w-full p-4">
      <div className="flex flex-col items-center">
        <img src={bugFixingSvg} className="w-40" alt="error" />
        <p className="mt-2 font-semibold">Couldn&apos;t load the command</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Make sure the command file is exists
        </p>
      </div>
    </div>
  );
}
