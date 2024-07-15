import { createBrowserRouter, redirect } from 'react-router-dom';
import RouteExtension from './routes/RouteExtension';
import DashboardApp from './DashboardApp';
import RouteWorkflow from './routes/RouteWorkflow';
import RouteWorkflows from './routes/RouteWorkflows';
import RouteWorkflowHistory from './routes/RouteWorkflowHistory';
// import RouteCredentials from './routes/RouteCredentials';
import RouteSettings from './routes/RouteSettings';

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
          element: <RouteExtension />,
        },
        {
          path: '/workflows',
          element: <RouteWorkflows />,
        },
        {
          path: '/workflows/:workflowId',
          element: <RouteWorkflow />,
        },
        {
          path: '/workflow-history',
          element: <RouteWorkflowHistory />,
        },
        // {
        //   path: '/credentials',
        //   element: <RouteCredentials />,
        // },
        {
          path: '/settings',
          element: <RouteSettings />,
        },
      ],
    },
  ],
  { basename: '/dashboard' },
);

export default router;
