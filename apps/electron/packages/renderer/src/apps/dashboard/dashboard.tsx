import React from 'react';
import ReactDOM from 'react-dom/client';
import '@repo/ui/dist/theme.css';
import '/@/assets/css/style.css';
import '/@/assets/css/fonts.css';
import { RouterProvider } from 'react-router-dom';
import router from './routes';

if (window.location.pathname === '/') {
  window.location.assign('/dashboard');
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
