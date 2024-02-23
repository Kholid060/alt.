import React from 'react';
import ReactDOM from 'react-dom/client';
import Extension from './Extension';
import '@repo/ui/theme.css';
import '/@/assets/css/style.css';

const extComponents = import.meta.glob('../components/extension/*.tsx', { eager: true });
for (const key in extComponents) {
  const { name, default: component } = extComponents[key] as { name: string; default: React.FC };
  if (!name || !component) continue;

  Object.defineProperty(window, name, {
    get() {
      return component;
    },
  });
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <Extension />
  </React.StrictMode>,
);
