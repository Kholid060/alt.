import {
  WebAppSocketData,
  WebAppWSClientToServerEvents,
  WebAppWSServerToClientEvents,
  WebAppWSInterServerEvents,
} from '@alt-dot/shared';
import { Socket, Namespace } from 'socket.io';

export type WebAppSocket = Socket<
  WebAppWSClientToServerEvents,
  WebAppWSServerToClientEvents,
  WebAppWSInterServerEvents,
  WebAppSocketData
>;

export type WebAppNamespace = Namespace<
  WebAppWSClientToServerEvents,
  WebAppWSServerToClientEvents,
  WebAppWSInterServerEvents,
  WebAppSocketData
>;
