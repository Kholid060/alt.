import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/css/style.css';
import './assets/css/fonts.css';
import '@alt-dot/ui/dist/theme.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
