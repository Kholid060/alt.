import { createBrowserRouter } from 'react-router-dom';
import RouteExtension, { extensionLoader } from './routes/RouteExtension';
import DashboardApp from './DashboardApp';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <DashboardApp />,
      children: [
        {
          path: 'extensions',
          loader: extensionLoader,
          element: <RouteExtension />,
        },
      ],
    },
  ],
  { basename: '/dashboard' },
);

export default router;
