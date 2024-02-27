import { protocol } from 'electron';
import { logger } from '/@/lib/log';

export interface CustomProtocol {
  scheme: string;
  privilege?: Electron.CustomScheme['privileges'];
  handler: Parameters<typeof Electron.protocol.handle>[1];
}

export function createErrorResponse({
  message,
  code = 'Internal server error',
  status = 500,
  headers,
}: {
  message: string;
  code?: string;
  status?: number;
  headers?: HeadersInit;
}) {
  return Response.json(
    {
      code,
      status,
      message,
    },
    {
      status,
      headers,
    },
  );
}

const protocols = import.meta.glob('./*Protocol.ts', { eager: true });

export function registerCustomProtocolsPrivileged() {
  const protocolPrivilege: Electron.CustomScheme[] = [];

  Object.values(protocols).forEach((protocol) => {
    const customProtocol = (protocol as { default?: CustomProtocol }).default;
    if (!customProtocol?.privilege) return;

    protocolPrivilege.push({
      scheme: customProtocol.scheme,
      privileges: customProtocol.privilege,
    });
  });

  protocol.registerSchemesAsPrivileged(protocolPrivilege);
}

export function registerCustomProtocols() {
  Object.values(protocols).forEach((customProtocolModule) => {
    const customProtocol = (
      customProtocolModule as { default?: CustomProtocol }
    ).default;
    if (!customProtocol) return;

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
}
