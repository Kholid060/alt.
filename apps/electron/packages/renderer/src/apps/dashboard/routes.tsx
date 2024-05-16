import { createBrowserRouter } from 'react-router-dom';
import RouteExtension from './routes/RouteExtension';
import DashboardApp from './DashboardApp';
import RouteWorkflow from './routes/RouteWorkflow';
import RouteWorkflows from './routes/RouteWorkflows';
import RouteWorkflowHistory from './routes/RouteWorkflowHistory';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <DashboardApp />,
      children: [
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
      ],
    },
  ],
  { basename: '/dashboard' },
);

export default router;
