import notFoundSvg from '@/assets/svg/404.svg';
import bugFixingSvg from '@/assets/svg/bug-fixing.svg';
import { UiButton } from '@alt-dot/ui';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

function ErrorPageBase({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'w-full max-w-md text-center flex flex-col items-center justify-center mx-auto',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function ErrorNotFoundPage({
  className,
  btnText = 'Back to home',
  btnPath = '/',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  btnText?: string;
  btnPath?: string;
}) {
  return (
    <ErrorPageBase {...props}>
      <img alt="not found illustration" src={notFoundSvg} className="h-96" />
      <h3 className="font-semibold text-lg">
        Looks like this page doesn&apos;t exist
      </h3>
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
      <h3 className="font-semibold text-lg">Something went wrong!</h3>
      <p>An error occurred when trying to load this page</p>
      <UiButton variant="secondary" className="mt-8 min-w-40" asChild>
        <Link to="/">Back to home</Link>
      </UiButton>
    </ErrorPageBase>
  );
}
