import { protocol } from 'electron';
import { logger } from '/@/lib/log';

export interface CustomProtocol {
  scheme: string;
  privilege?: Electron.CustomScheme['privileges'];
  handler: Parameters<typeof Electron.protocol.handle>[1];
}

export function createErrorResponse(
  { message, code = 'Internal server error', status = 500, headers }:
  { message: string; code?: string, status?: number, headers?: HeadersInit },
) {
  return Response.json({
    code,
    status,
    message,
  }, {
    status,
    headers,
  });
}

export function registerCustomProtocols() {
  const protocols = import.meta.glob('./*Protocol.ts', { eager: true });
  const privileges: Record<string, Electron.CustomScheme['privileges']> = {};

  Object.values(protocols).forEach((customProtocolModule) => {
    const customProtocol = (customProtocolModule as { default?: CustomProtocol }).default;
    if (!customProtocol) return;

    if (customProtocol.privilege) {
      privileges[customProtocol.scheme] = customProtocol.privilege;
    }

    protocol.handle(customProtocol.scheme, async (request) => {
      try {
        return await customProtocol.handler(request);
      } catch (error) {
        if (error instanceof Error) {
          logger('error', ['PROTOCOL', customProtocol.scheme], error.message);
        }

        return createErrorResponse({
          message: 'Something went wrong',
        });
      }
    });
  });

  const customPrivileges = Object.entries(privileges).map(([scheme, privileges]) => ({
    scheme,
    privileges,
  }));
  if (customPrivileges.length === 0) return;

  protocol.registerSchemesAsPrivileged(customPrivileges);
}

