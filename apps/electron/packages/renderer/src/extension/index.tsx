import React from 'react';
import ReactDOM from 'react-dom/client';
import Extension from './Extension';
import '@repo/ui/theme.css';
import '/@/assets/css/style.css';

window.addEventListener('message', (event) => {
  console.log('sandbox-message: ', event, event.ports[0]);
  console.log(event.ports[0].postMessage('haha'));
});

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <Extension />
  </React.StrictMode>,
);
