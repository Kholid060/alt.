import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/css/style.css';
import './assets/css/fonts.css';
import '@alt-dot/ui/dist/theme.css';
import { RouterProvider } from 'react-router-dom';
import createRouter from './routes.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UiSkeleton } from '@alt-dot/ui';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider
        router={createRouter(queryClient)}
        fallbackElement={
          <div className="container">
            <UiSkeleton className="h-12 mt-4" />
            <UiSkeleton className="h-8 mt-24 max-w-sm" />
            <div className="flex flex-col md:flex-row mt-4 gap-4">
              <UiSkeleton className="h-48 w-full md:w-64" />
              <UiSkeleton className="h-48 flex-1" />
            </div>
            <UiSkeleton className="h-64 w-full mt-4" />
          </div>
        }
      />
    </QueryClientProvider>
  </React.StrictMode>,
);
