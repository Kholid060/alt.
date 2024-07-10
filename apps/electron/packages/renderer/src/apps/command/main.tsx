import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@altdot/ui/dist/theme.css';
import '/@/assets/css/style.css';
import '/@/assets/css/fonts.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
