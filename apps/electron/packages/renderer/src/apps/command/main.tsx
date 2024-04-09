import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@repo/ui/dist/theme.css';
import '/@/assets/css/style.css';
import '/@/assets/css/fonts.css';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
