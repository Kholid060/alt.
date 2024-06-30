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
