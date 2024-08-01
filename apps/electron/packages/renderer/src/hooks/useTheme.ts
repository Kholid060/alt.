import { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../context/theme.context';

const preferDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

export function useTheme() {
  const themeContext = useContext(ThemeContext);

  function isDarkTheme() {
    if (themeContext.theme === 'system') {
      return preferDarkQuery.matches;
    }

    return themeContext.theme === 'dark';
  }

  return { ...themeContext, isDarkTheme };
}

export function useIsDarkTheme() {
  const [preferDark, setPreferDark] = useState(() => preferDarkQuery.matches);

  useEffect(() => {
    const onColorSchemeChanged = (event: MediaQueryListEvent) => {
      setPreferDark(event.matches);
    };
    preferDarkQuery.addEventListener('change', onColorSchemeChanged);

    return () => {
      preferDarkQuery.removeEventListener('change', onColorSchemeChanged);
    };
  }, []);

  return preferDark;
}
