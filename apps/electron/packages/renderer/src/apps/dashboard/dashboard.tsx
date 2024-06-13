import React from 'react';
import ReactDOM from 'react-dom/client';
import '@alt-dot/ui/dist/theme.css';
import '/@/assets/css/style.css';
import '/@/assets/css/fonts.css';
import '/@/assets/css/workflow-editor-style.css';
import { RouterProvider } from 'react-router-dom';
import router from './routes';
import { DialogProvider, UiToaster, UiTooltipProvider } from '@alt-dot/ui';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { DatabaseProvider } from '/@/context/database.context';

if (window.location.pathname === '/') {
  window.location.assign('/dashboard');
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <HotkeysProvider>
      <DialogProvider>
        <UiTooltipProvider>
          <DatabaseProvider>
            <UiToaster />
            <RouterProvider router={router} />
          </DatabaseProvider>
        </UiTooltipProvider>
      </DialogProvider>
    </HotkeysProvider>
  </React.StrictMode>,
);
