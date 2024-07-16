import { createBrowserRouter, redirect } from 'react-router-dom';
import DashboardApp from './DashboardApp';
// import RouteCredentials from './routes/RouteCredentials';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <DashboardApp />,
      children: [
        {
          path: '',
          loader() {
            return redirect('/extensions');
          },
        },
        {
          path: 'extensions',
          lazy: () => import('./routes/RouteExtension'),
        },
        {
          path: '/workflows',
          lazy: () => import('./routes/RouteWorkflows'),
        },
        {
          path: '/workflows/:workflowId',
          lazy: () => import('./routes/RouteWorkflow'),
        },
        {
          path: '/workflow-history',
          lazy: () => import('./routes/RouteWorkflowHistory'),
        },
        // {
        //   path: '/credentials',
        //   element: <RouteCredentials />,
        // },
        {
          path: '/settings',
          lazy: () => import('./routes/RouteSettings'),
        },
      ],
    },
  ],
  { basename: '/dashboard' },
);

export default router;
