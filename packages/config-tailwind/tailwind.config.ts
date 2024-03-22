import { fontFamily } from 'tailwindcss/defaultTheme'
import { Config } from 'tailwindcss/types/config';
import flattenColorPalette from 'tailwindcss/lib/util/flattenColorPalette';

const rgbVarColor = (varName: string) => `rgb(var(--${varName}) / <alpha-value>)`;
const generateRadixColors = (name: string, reverse = false) => {
  return Array.from({ length: 12 }).reduce<Record<number, string>>((acc, _, idx) => {
    const num = reverse ? 12 - idx : idx + 1;
    acc[idx + 1] = rgbVarColor(`${name}-${num}`);
  
    return acc;
  }, {});
}

const config: Omit<Config, 'content'> = {
  darkMode: ['class'],
  plugins: [
    require('tailwindcss-animate'),
    function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          highlight: (value) => ({ boxShadow: `inset 0 1px 0 0 ${value}` }),
        },
        {
          values: flattenColorPalette(theme('backgroundColor')),
          type: 'color',
        },
      );
    },
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        ring: rgbVarColor('ring'),
        input: rgbVarColor('input'),
        border: rgbVarColor('border'),
        'input-focus': rgbVarColor('input-focus'),
        background: rgbVarColor('background'),
        foreground: rgbVarColor('foreground'),
        mauve: generateRadixColors('mauve'),
        'mauve-dark': generateRadixColors('mauve', true),
        violet: generateRadixColors('violet'),
        'violet-dark': generateRadixColors('violet', true),
        ruby: generateRadixColors('ruby'),
        'ruby-dark': generateRadixColors('ruby', true),
        primary: {
          DEFAULT: rgbVarColor('primary'),
          hover: rgbVarColor('primary-hover'),
          foreground: rgbVarColor('primary-foreground'),
        },
        secondary: {
          DEFAULT: rgbVarColor('secondary'),
          hover: rgbVarColor('secondary-hover'),
          selected: rgbVarColor('secondary-selected'),
          foreground: rgbVarColor('secondary-foreground'),
        },
        destructive: {
          DEFAULT: rgbVarColor('destructive'),
          text: rgbVarColor('destructive-text'),
          foreground: rgbVarColor('destructive-foreground'),
        },
        muted: {
          DEFAULT: rgbVarColor('muted'),
          foreground: rgbVarColor('muted-foreground'),
        },
        accent: {
          DEFAULT: rgbVarColor('accent'),
          foreground: rgbVarColor('accent-foreground'),
        },
        popover: {
          DEFAULT: rgbVarColor('popover'),
          foreground: rgbVarColor('popover-foreground'),
        },
        card: {
          DEFAULT: rgbVarColor('card'),
          foreground: rgbVarColor('card-foreground'),
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
        mono: ['var(--font-mono)', ...fontFamily.mono],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
};

export default config;
