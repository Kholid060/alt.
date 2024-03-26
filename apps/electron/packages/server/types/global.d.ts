import type Electron from 'electron';

declare namespace NodeJS {
  interface Process {
    parentPort: Electron.parentPort;
  }
}
