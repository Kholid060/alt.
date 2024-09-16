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

const serializeObject = (value) => {
  if (typeof value === 'object' && !Array.isArray(value)) {
    const constructorStr = value.constructor.toString();
    if (constructorStr.startsWith('class') || constructorStr.startsWith('function')) {
      return value.constructor.name + ' ' + JSON.stringify(value, Object.getOwnPropertyNames(value), 2);
    }
  }

  return value;
}

const methods = ['error', 'info', 'log', 'warn'];
const terminalConsole = Object.fromEntries(
  methods.map((type) => [
    type,
    (...args) => {
      send(type, args.map(serializeObject));
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
