import { createBrowserRouter } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import StorePage from './pages/StorePage';
import AuthPage from './pages/auth/AuthPage';
import AuthRedirectPage from './pages/auth/redirect/AuthRedirect';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/store',
    element: <StorePage />,
  },
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/oauth/redirect',
    element: <AuthRedirectPage />,
  },
]);

export default router;
