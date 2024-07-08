import { ErrorPage, ErrorNotFoundPage } from '@/components/ErrorPage';
import { PageError } from '@/utils/custom-error';
import { FetchError } from '@altdot/shared';
import { ErrorRouteComponent } from '@tanstack/react-router';

function getError(error: unknown) {
  if (error instanceof Error) {
    return `${error.message}\n${error.stack}`;
  }

  return JSON.stringify(error, null, 2);
}

const AppErrorBoundary: ErrorRouteComponent = ({ error }) => {
  let page = <ErrorPage />;
  if (
    PageError.isPageError(error, 404) ||
    (FetchError.isFetchError(error) && error.status === 404)
  ) {
    page = <ErrorNotFoundPage {...error.data} />;
  }

  return (
    <div className="h-screen w-screen py-12">
      {page}
      {import.meta.env.DEV && (
        <pre className="mx-auto mt-12 max-w-2xl overflow-auto rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          {getError(error)}
        </pre>
      )}
    </div>
  );
};

export default AppErrorBoundary;
