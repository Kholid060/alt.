import { createBrowserRouter, redirect } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/auth/AuthPage';
import AuthRedirectPage from './pages/auth/redirect/AuthRedirect';
import SettingsLayout from './pages/settings/SettingsLayout';
import { AuthGuard, NoAuthGuard } from './components/auth/AuthGuard';
import SettingsProfilePage from './pages/settings/SettingsProfilePage';
import App, { appLoader } from './App';
import DevConsoleExtensionsPage from './pages/devconsole/extensions/ExtensionsPage';
import DevConsoleExtensionsNewPage from './pages/devconsole/extensions/ExtensionsNewPage';
import DevConsoleLayout from './pages/devconsole/DevConsoleLayout';
import DevConsoleWorkflowsPage from './pages/devconsole/workflows/WorkflowsPage';
import DevConsoleExtensionsDetailPage from './pages/devconsole/extensions/ExtensionsDetailPage';
import StoreLayout from './pages/store/StoreLayout';
import StoreExtensionsPage, {
  storeExtensionsPageLoader,
} from './pages/store/StoreExtensionsPage';
import StoreWorkflowsPage from './pages/store/StoreWorkflowsPage';
import AdminPage from './pages/AdminPage';
import { UserRole } from './utils/constant';
import { QueryClient } from '@tanstack/react-query';
import AppErrorBoundary from './components/app/AppErrorBoundary';
import StoreExtensionsDetailPage, {
  storeExtensionsDetailPage,
} from './pages/store/StoreExtensionsDetailPage';

const createRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: '/',
      element: <App />,
      loader: appLoader,
      errorElement: <AppErrorBoundary />,
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
              loader: storeExtensionsPageLoader(queryClient),
            },
            {
              path: 'extensions/:extensionName/:extensionId',
              element: <StoreExtensionsDetailPage />,
              loader: storeExtensionsDetailPage(queryClient),
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
          path: 'admin/dashboard',
          element: <AuthGuard element={AdminPage} role={UserRole.Admin} />,
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

export default createRouter;
