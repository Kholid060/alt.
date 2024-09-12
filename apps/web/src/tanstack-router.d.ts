import { WebAppWorkflow } from '@altdot/shared';

declare module '@tanstack/react-router' {
  interface HistoryState {
    newWorkflow?: WebAppWorkflow;
    newExtension?: import('./routes/devconsole/extensions/new').ExtensionNewPayload;
  }
}
