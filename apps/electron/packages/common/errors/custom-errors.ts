export class ExtensionError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ExtensionError';
  }
}

export class ValidationError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
