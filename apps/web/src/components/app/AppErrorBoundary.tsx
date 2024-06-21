import { ErrorPage, ErrorNotFoundPage } from '@/pages/ErrorPage';
import { PageError } from '@/utils/custom-error';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

function getError(error: unknown) {
  if (error instanceof Error) {
    return `${error.message}\n${error.stack}`;
  }
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}\n\n${error.data}`;
  }

  return JSON.stringify(error, null, 2);
}

export function AppErrorBoundary() {
  const error = useRouteError();

  let page = <ErrorPage />;
  if (
    PageError.isPageError(error, 404) ||
    (isRouteErrorResponse(error) && error.status === 404)
  ) {
    page = <ErrorNotFoundPage {...error.data} />;
  }

  return (
    <div className="h-screen w-screen py-12">
      {page}
      {import.meta.env.DEV && (
        <pre className="bg-card p-4 rounded-lg border mt-12 text-sm max-w-2xl mx-auto overflow-auto text-muted-foreground">
          {getError(error)}
        </pre>
      )}
    </div>
  );
}

export default AppErrorBoundary;
