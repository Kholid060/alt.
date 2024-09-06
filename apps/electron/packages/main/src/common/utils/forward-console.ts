export interface ForwardConsolePayload {
  args: unknown[];
  type: '$appConsole';
  commandTitle: string;
  extensionTitle: string;
  level: 'debug' | 'log' | 'error' | 'info' | 'warn';
}

const consoleKeys: ForwardConsolePayload['level'][] = [
  'debug',
  'log',
  'error',
  'info',
  'warn',
];

export const FORWARD_CONSOLE_TYPE = '$appConsole';

function forwardConsole(
  additionalProps: Pick<
    ForwardConsolePayload,
    'extensionTitle' | 'commandTitle'
  >,
  sendMessage: (payload: ForwardConsolePayload) => void,
): Console {
  const originalConsole = console;
  return {
    ...originalConsole,
    ...Object.fromEntries(
      consoleKeys.map((key) => [
        key,
        (...args: unknown[]) => {
          sendMessage({
            args,
            level: key,
            type: FORWARD_CONSOLE_TYPE,
            ...additionalProps,
          });
          originalConsole[key](...args);
        },
      ]),
    ),
  };
}

export default forwardConsole;
