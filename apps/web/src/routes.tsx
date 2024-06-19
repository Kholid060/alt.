import { createBrowserRouter, redirect } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/auth/AuthPage';
import AuthRedirectPage from './pages/auth/redirect/AuthRedirect';
import SettingsLayout from './pages/settings/SettingsLayout';
import { AuthGuard, NoAuthGuard } from './components/auth/AuthGuard';
import SettingsProfilePage from './pages/settings/SettingsProfilePage';
import App from './App';
import DevConsoleExtensionsPage from './pages/devconsole/extensions/ExtensionsPage';
import DevConsoleExtensionsNewPage from './pages/devconsole/extensions/ExtensionsNewPage';
import DevConsoleLayout from './pages/devconsole/DevConsoleLayout';
import DevConsoleWorkflowsPage from './pages/devconsole/workflows/WorkflowsPage';
import DevConsoleExtensionsDetailPage from './pages/devconsole/extensions/ExtensionsDetailPage';
import StoreLayout from './pages/store/StoreLayout';
import StoreExtensionsPage from './pages/store/StoreExtensionsPage';
import StoreWorkflowsPage from './pages/store/StoreWorkflowsPage';

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
        element: <StoreLayout />,
        children: [
          {
            path: '',
            loader() {
              return redirect('extensions');
            },
          },
          {
            path: 'extensions',
            element: <StoreExtensionsPage />,
          },
          {
            path: 'workflows',
            element: <StoreWorkflowsPage />,
          },
        ],
      },
      {
        path: 'auth',
        element: <NoAuthGuard element={AuthPage} />,
      },
      {
        path: 'devconsole',
        element: <AuthGuard element={DevConsoleLayout} />,
        children: [
          {
            path: '',
            loader() {
              return redirect('extensions');
            },
          },
          {
            path: 'extensions',
            element: <DevConsoleExtensionsPage />,
          },
          {
            path: 'extensions/new',
            element: <DevConsoleExtensionsNewPage />,
          },
          {
            path: 'extensions/:id',
            element: <DevConsoleExtensionsDetailPage />,
          },
          {
            path: 'workflows',
            element: <DevConsoleWorkflowsPage />,
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
