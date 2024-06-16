import { Outlet, createBrowserRouter } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import StorePage from './pages/StorePage';
import AuthPage from './pages/auth/AuthPage';
import AuthRedirectPage from './pages/auth/redirect/AuthRedirect';
import SettingsLayout from './pages/settings/SettingsLayout';
import { AuthGuard, NoAuthGuard } from './components/auth/AuthGuard';
import SettingsProfilePage from './pages/settings/SettingsProfilePage';
import App from './App';
import ExtensionsPage from './pages/extensions/ExtensionsPage';
import ExtensionsNewPage from './pages/extensions/ExtensionsNewPage';

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
        path: 'auth',
        element: <NoAuthGuard element={AuthPage} />,
      },
      {
        path: 'devconsole',
        element: <AuthGuard element={Outlet} />,
        children: [
          {
            path: 'extensions',
            element: <ExtensionsPage />,
          },
          {
            path: 'extensions/new',
            element: <ExtensionsNewPage />,
          },
        ],
      },
      {
        path: 'settings',
        element: <AuthGuard element={SettingsLayout} />,
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
