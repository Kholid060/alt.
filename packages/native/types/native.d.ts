declare module '*index.node' {
  export function type(text: string): void;
  export function press(type: 'up' | 'down', ...keys: number[]): void;
}
