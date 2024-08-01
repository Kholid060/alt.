import { AppTheme } from '#packages/common/interface/app.interface';
import { createContext, useEffect, useState } from 'react';
import preloadAPI from '../utils/preloadAPI';
import { applyTheme } from '#packages/common/utils/helper';

export interface ThemeContextState {
  theme: AppTheme;
  updateTheme(theme: AppTheme): void;
}

export const ThemeContext = createContext<ThemeContextState>({
  theme: 'system',
  updateTheme() {
    throw new Error('Method not implemented');
  },
});

export function ThemeProvider({ children }: { children?: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>('system');

  function updateTheme(newTheme: AppTheme) {
    setTheme(newTheme);
    applyTheme(newTheme);
  }

  useEffect(() => {
    preloadAPI.main.ipc.invoke('app:get-settings', 'theme').then((value) => {
      setTheme(value as AppTheme);
      applyTheme(value as AppTheme);
    });
  }, []);
  useEffect(() => {
    const offSettingsChanged = preloadAPI.main.ipc.on(
      'app:settings-changed',
      (_, value) => {
        if (value.theme === theme) return;

        setTheme(value.theme);
        applyTheme(value.theme);
      },
    );

    const onSystemColorSchemeChanged = () => {
      if (theme !== 'system') return;
      applyTheme('system');
    };
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', onSystemColorSchemeChanged);

    return () => {
      offSettingsChanged();
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .removeEventListener('change', onSystemColorSchemeChanged);
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
