import { createBrowserRouter } from 'react-router-dom';
import RouteExtension from './routes/RouteExtension';
import DashboardApp from './DashboardApp';
import RouteWorkflow from './routes/RouteWorkflow';

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
      ],
    },
    {
      path: '/workflows/:workflowId',
      element: <RouteWorkflow />,
    },
  ],
  { basename: '/dashboard' },
);

export default router;
