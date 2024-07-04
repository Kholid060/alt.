import notFoundSvg from '@/assets/svg/404.svg';
import bugFixingSvg from '@/assets/svg/bug-fixing.svg';
import { UiButton } from '@alt-dot/ui';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';

function ErrorPageBase({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'mx-auto flex w-full max-w-md flex-col items-center justify-center text-center',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function ErrorNotFoundPage({
  message,
  className,
  btnPath = '/',
  btnText = 'Back to home',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  btnText?: string;
  btnPath?: string;
  message?: string;
}) {
  return (
    <ErrorPageBase {...props}>
      <img alt="not found illustration" src={notFoundSvg} className="h-96" />
      <h3 className="text-lg font-semibold">
        Looks like this page doesn&apos;t exist
      </h3>
      <p className="text-muted-foreground">{message}</p>
      <UiButton variant="secondary" className="mt-8 min-w-40" asChild>
        <Link to={btnPath}>{btnText}</Link>
      </UiButton>
    </ErrorPageBase>
  );
}

export function ErrorPage(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <ErrorPageBase {...props}>
      <img alt="error illustration" src={bugFixingSvg} className="h-96" />
      <h3 className="text-lg font-semibold">Something went wrong!</h3>
      <p className="text-muted-foreground">
        An error occurred when trying to load this page
      </p>
      <UiButton variant="secondary" className="mt-8 min-w-40" asChild>
        <Link to="/">Back to home</Link>
      </UiButton>
    </ErrorPageBase>
  );
}
