import { WebAppWorkflow } from '@alt-dot/shared';

declare module '@tanstack/react-router' {
  interface HistoryState {
    newWorkflow?: WebAppWorkflow;
  }
}
