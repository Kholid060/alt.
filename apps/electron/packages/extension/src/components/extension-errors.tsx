import React from 'react';
import { ExtensionMessagePortEvent } from '@altdot/extension';
import { BetterMessagePortSync } from '@altdot/shared';
import { UiButton, UiLogo } from '@altdot/ui';
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

export function ExtensionErrorUnhandled({ error }: { error: Error }) {
  const [mappedStack, setMappedStack] = React.useState('');

  React.useEffect(() => {
    mapStackTrace(error.stack, (stackTrace) => {
      setMappedStack(
        (error.stack?.slice(0, error.stack.indexOf('\n')) ?? '') +
          '\n' +
          stackTrace.join('\n'),
      );
    });
  }, [error]);

  return (
    <div className="h-full w-full p-4">
      <div className="flex flex-col items-center">
        <img src={bugFixingSvg} className="w-40" alt="error" />
        <p className="mt-2 font-semibold">
          Error when trying to render the command
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try to reload the app, and open a bug report in the <UiLogo />{' '}
          repository if the error persists.
        </p>
        <div className="mt-4 whitespace-pre-wrap rounded-lg bg-card p-4 font-mono text-sm text-muted-foreground">
          {mappedStack}
        </div>
      </div>
    </div>
  );
}

export function ExtensionErrorUnhandledVanilla(error: Error) {
  const container = document.createElement('div');
  container.classList.value = 'h-full w-full p-4 flex flex-col items-center';

  const image = document.createElement('img');
  image.src = bugFixingSvg;
  image.classList.value = 'w-40';

  const title = document.createElement('p');
  title.textContent = 'Error when trying to render the command';
  title.classList.value = 'mt-2 font-semibold';

  const description = document.createElement('p');
  description.textContent =
    'Try to reload the app, and open a bug report in the alt. repository if the error persists.';
  description.classList.value = 'mt-1 text-sm text-muted-foreground';

  const stackTrace = document.createElement('pre');
  stackTrace.classList.value =
    'mt-4 whitespace-pre-wrap rounded-lg bg-card p-4 font-mono text-sm text-muted-foreground';

  mapStackTrace(error.stack, (trace) => {
    stackTrace.textContent =
      (error.stack?.slice(0, error.stack.indexOf('\n')) ?? '') +
      '\n' +
      trace.join('\n');
  });

  container.appendChild(image);
  container.appendChild(title);
  container.appendChild(description);
  container.appendChild(stackTrace);

  document.querySelector('#app')?.appendChild(container);
}
