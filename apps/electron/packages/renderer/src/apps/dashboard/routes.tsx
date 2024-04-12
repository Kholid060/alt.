import { createBrowserRouter } from 'react-router-dom';
import RouteExtension from './routes/RouteExtension';
import DashboardApp from './DashboardApp';

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
  ],
  { basename: '/dashboard' },
);

export default router;
