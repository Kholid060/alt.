import { protocol } from 'electron';
import { logger } from '/@/lib/log';

export interface CustomProtocolHandler {
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

const protocols = import.meta.glob('./*Protocol.ts', { eager: true }) as Record<
  string,
  { default: CustomProtocolHandler }
>;

class CustomProtocol {
  static registerPrivileged() {
    const protocolPrivilege: Electron.CustomScheme[] = [];

    Object.values(protocols).forEach((customProtocol) => {
      if (!customProtocol.default?.privilege) return;

      protocolPrivilege.push({
        scheme: customProtocol.default.scheme,
        privileges: customProtocol.default.privilege,
      });
    });

    protocol.registerSchemesAsPrivileged(protocolPrivilege);
  }

  static registerProtocols() {
    for (const key in protocols) {
      const customProtocol = protocols[key].default;
      if (!customProtocol) return;

      protocol.handle(customProtocol.scheme, async (request) => {
        try {
          return await customProtocol.handler(request);
        } catch (error) {
          if (error instanceof Error) {
            logger(
              'error',
              ['PROTOCOL', customProtocol.scheme],
              error.message,
              request.url,
            );
          }

          return createErrorResponse({
            message: 'Something went wrong',
          });
        }
      });
    }
  }
}

export default CustomProtocol;
