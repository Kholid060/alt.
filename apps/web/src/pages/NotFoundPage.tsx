import notFoundSvg from '@/assets/svg/404.svg';
import { UiButton } from '@alt-dot/ui';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

function NotFoundPage({
  className,
  btnText = 'Back to home',
  btnPath = '/',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  btnText?: string;
  btnPath?: string;
}) {
  return (
    <div
      className={clsx(
        'w-full max-w-md text-center flex flex-col items-center justify-center',
        className,
      )}
      {...props}
    >
      <img alt="not found illustration" src={notFoundSvg} className="h-96" />
      <h3 className="font-semibold text-lg">
        Looks like this page doesn&apos;t exist
      </h3>
      <UiButton variant="secondary" className="mt-8 min-w-40" asChild>
        <Link to={btnPath}>{btnText}</Link>
      </UiButton>
    </div>
  );
}

export default NotFoundPage;
