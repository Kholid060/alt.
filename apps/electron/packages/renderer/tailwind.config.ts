/* eslint-disable @typescript-eslint/no-explicit-any */
import sharedConfig from '@altdot/tailwind-config';
import defaultConfig from 'tailwindcss/defaultTheme';

const safelistSpacing = Object.keys(defaultConfig.spacing).flatMap((space) => [
  ...['', 'b', 'r', 't', 'l', 'x', 'y'].flatMap((dir) => [
    `p${dir}-${space}`,
    `m${dir}-${space}`,
  ]),
  `w-${space}`,
  `h-${space}`,
  `gap-${space}`,
  `size-${space}`,
  `gap-x-${space}`,
  `gap-y-${space}`,
]);
const generateFromConfig = (config: Record<string, any>, prefix: string) =>
  Object.keys(config).map((key) => `${prefix}-${key}`);

const display = [
  'block',
  'inline-block',
  'inline',
  'flex',
  'inline-flex',
  'table',
  'inline-table',
  'table-caption',
  'table-cell',
  'table-column',
  'table-column-group',
  'table-footer-group',
  'table-header-group',
  'table-row-group',
  'table-row',
  'flow-root',
  'grid',
  'inline-grid',
  'contents',
  'list-item',
  'hidden',
];

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './*.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../packages/extension/src/**/*.tsx',
    '../../../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    '../../../../packages/workflow/src/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'grow',
    'grow-0',
    'flex-auto',
    'flex-row-reverse',
    'flex-col-reverse',
    'items-start',
    'items-end',
    'items-center',
    'items-baseline',
    'items-stretch',
    'justify-normal',
    'justify-start',
    'justify-end',
    'justify-center',
    'justify-between',
    'justify-around',
    'justify-evenly',
    'justify-stretch',
    'flex-wrap',
    'flex-wrap-reverse',
    'flex-nowrap',
    ...display,
    ...safelistSpacing,
    ...generateFromConfig(defaultConfig.flex, 'flex'),
    ...generateFromConfig(defaultConfig.gridRow, 'row'),
    ...generateFromConfig(defaultConfig.gridColumn, 'col'),
    ...generateFromConfig(defaultConfig.gridTemplateRows, 'grid-rows'),
    ...generateFromConfig(defaultConfig.gridTemplateRows, 'grid-cols'),
  ],
  presets: [sharedConfig],
};
