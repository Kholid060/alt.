import React from 'react';
import ReactDOM from 'react-dom/client';
import '@repo/ui/dist/theme.css';
import '/@/assets/css/style.css';
import '/@/assets/css/fonts.css';
import { RouterProvider } from 'react-router-dom';
import router from './routes';
import { UiToaster, UiTooltipProvider } from '@repo/ui';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { DatabaseProvider } from '/@/context/database.context';

if (window.location.pathname === '/') {
  window.location.assign('/dashboard');
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <HotkeysProvider>
      <UiTooltipProvider>
        <DatabaseProvider>
          <UiToaster />
          <RouterProvider router={router} />
        </DatabaseProvider>
      </UiTooltipProvider>
    </HotkeysProvider>
  </React.StrictMode>,
);
