import { useContext } from 'react';
import { ThemeContext } from '../context/theme.context';

export function useTheme() {
  const themeContext = useContext(ThemeContext);

  function isDarkTheme() {
    if (themeContext.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    return themeContext.theme === 'dark';
  }

  return { ...themeContext, isDarkTheme };
}
