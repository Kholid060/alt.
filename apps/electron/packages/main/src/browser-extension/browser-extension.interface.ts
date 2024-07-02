import {
  ExtensionWSClientToServerEvents,
  ExtensionWSServerToClientEvents,
  ExtensionWSInterServerEvents,
  ExtensionSocketData,
} from '@alt-dot/shared';
import { Socket, Namespace } from 'socket.io';

export type BrowserExtensionSocket = Socket<
  ExtensionWSClientToServerEvents,
  ExtensionWSServerToClientEvents,
  ExtensionWSInterServerEvents,
  ExtensionSocketData
>;

export type BrowserExtensionNamespace = Namespace<
  ExtensionWSClientToServerEvents,
  ExtensionWSServerToClientEvents,
  ExtensionWSInterServerEvents,
  ExtensionSocketData
>;
