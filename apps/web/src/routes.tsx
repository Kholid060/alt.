import { createBrowserRouter } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import StorePage from './pages/StorePage';
import AuthPage from './pages/AuthPage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/store",
    element: <StorePage />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
]);

export default router;
