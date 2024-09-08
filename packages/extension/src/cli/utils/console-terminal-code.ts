export function createConsoleTerminalCode(port: number) {
  return `
const originalConsole = console;

const send = (type, args) => {
  fetch('http://127.0.0.1:${port}/console', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, args }),
  });
};

const methods = ['error', 'info', 'log', 'warn'];
const terminalConsole = Object.fromEntries(
  methods.map((type) => [
    type,
    (...args) => {
      send(type, args);
      originalConsole[type](...args);
    },
  ]),
);

globalThis.console = {
  ...originalConsole,
  ...terminalConsole,
}
  `.trim();
}
