import { createBrowserRouter } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import StorePage from './pages/StorePage';
import AuthPage from './pages/auth/AuthPage';
import AuthRedirectPage from './pages/auth/redirect/AuthRedirect';
import SettingsLayout from './pages/settings/SettingsLayout';
import { AuthGuard, NoAuthGuard } from './components/auth/AuthGuard';
import SettingsProfilePage from './pages/settings/SettingsProfilePage';
import App from './App';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        element: <LandingPage />,
      },
      {
        path: 'store',
        element: <StorePage />,
      },
      {
        path: '/auth',
        element: (
          <NoAuthGuard>
            <AuthPage />
          </NoAuthGuard>
        ),
      },
      {
        path: '/settings',
        element: (
          <AuthGuard>
            <SettingsLayout />
          </AuthGuard>
        ),
        children: [
          {
            path: 'profile',
            element: <SettingsProfilePage />,
          },
        ],
      },
    ],
  },
  {
    path: '/oauth/redirect',
    element: <AuthRedirectPage />,
  },
]);

export default router;
