import { APP_TITLE } from '@/utils/constant';
import { createFileRoute } from '@tanstack/react-router';
import { Helmet } from 'react-helmet-async';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div>
      <Helmet>
        <title>{APP_TITLE} store</title>
      </Helmet>
      <p>landing page</p>
    </div>
  );
}
