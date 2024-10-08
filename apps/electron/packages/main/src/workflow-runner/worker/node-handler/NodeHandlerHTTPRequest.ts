import { WORKFLOW_NODE_TYPE } from '@altdot/workflow/dist/const/workflow-nodes-type.const';
import WorkflowFileHandle from '../utils/WorkflowFileHandle';
import type {
  WorkflowNodeHandlerExecute,
  WorkflowNodeHandlerExecuteReturn,
} from './WorkflowNodeHandler';
import fs from 'fs-extra';
import WorkflowNodeHandler from './WorkflowNodeHandler';

async function getRequestBody({
  node,
  runner,
}: Pick<
  WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.HTTP_REQUEST>,
  'node' | 'runner'
>) {
  const headers: HeadersInit = {};
  let body: BodyInit | undefined = undefined;

  const evaluateExpressions = async (dataKey: string) => {
    if (!node.data.$bodyExpData) return node.data;

    const expression = await runner.sandbox.evaluateExpAndApply(
      node.data.$bodyExpData,
      node.data,
      { filter: (key) => key.startsWith(dataKey) },
    );
    if (!expression.isApplied) return node.data;

    return expression.data;
  };

  switch (node.data.bodyType) {
    case 'form-data': {
      const formData = new FormData();
      const data = await evaluateExpressions('formDataBody');
      for (const item of data.formDataBody) {
        if (WorkflowFileHandle.isWorkflowFileHandle(item.value)) {
          const file = await fs.readFile(item.value.path);
          formData.append(item.name, new Blob([file]), item.value.filename);
          continue;
        }

        formData.append(item.name, item.value);
      }

      body = formData;
      break;
    }
    case 'form-urlencoded': {
      const searchParams = new URLSearchParams();
      const data = await evaluateExpressions('urlEncodedBody');
      data.urlEncodedBody.forEach((item) => {
        searchParams.append(item.name, item.value);
      });

      body = searchParams;
      headers['Content-Type'] = 'application/x-www-form-urlencoded';

      break;
    }
    case 'json': {
      const data = await evaluateExpressions('jsonBody');
      body =
        typeof data.jsonBody === 'string'
          ? data.jsonBody
          : JSON.stringify(data.jsonBody);
      headers['Content-type'] = 'application/json';

      break;
    }
    case 'raw': {
      const data = await evaluateExpressions('rawBody');
      body = data.rawBody.data;
      headers['Content-Type'] = data.rawBody.contentType;

      break;
    }
    case 'none':
      body = undefined;
      break;
  }

  return {
    body,
    headers,
  };
}

async function getResponseBody(response: Response) {
  const contentType = response.headers.get('Content-Type');
  if (!contentType) return null;

  if (contentType.includes('application/json')) return response.json();
  if (contentType.includes('text/')) return response.text();

  return response.arrayBuffer();
}

export class NodeHandlerHTTPRequest extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.HTTP_REQUEST> {
  private fetchs: Record<
    string,
    { timeout?: NodeJS.Timeout; controller: AbortController }
  > = {};

  constructor() {
    super(WORKFLOW_NODE_TYPE.HTTP_REQUEST, {
      dataValidation: [
        { key: 'url', name: 'Endpoint URL', types: ['String'] },
        { key: 'timeoutMs', name: 'Timeout', types: ['Number'] },
      ],
    });
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.HTTP_REQUEST>): Promise<WorkflowNodeHandlerExecuteReturn> {
    const nodeId = `${node.id}${runner.stepCount}`;

    const controller = new AbortController();
    if (!this.fetchs[nodeId]) this.fetchs[nodeId] = { controller };

    if (node.data.timeoutMs > 0) {
      this.fetchs[nodeId].timeout = setTimeout(() => {
        controller.abort(new Error('TIMEOUT'));
      }, node.data.timeoutMs);
    }

    const url = new URL(node.data.url);
    node.data.queries.forEach((query) => {
      url.searchParams.set(query.name, query.value);
    });

    const headers = Object.fromEntries(
      node.data.headers.map(({ name, value }) => [name, value]),
    );
    const body =
      node.data.method !== 'GET'
        ? await getRequestBody({ node, runner })
        : { body: undefined, headers: {} };

    if (node.data.bodyType === 'form-data') delete headers['Content-Type'];

    const requestInit: RequestInit = {
      headers: {
        ...headers,
        ...body.headers,
      },
      body: body.body,
      method: node.data.method,
      signal: controller.signal,
    };

    const response = await fetch(url, requestInit);
    const responseBody = await getResponseBody(response);

    clearTimeout(this.fetchs[nodeId].timeout);
    delete this.fetchs[nodeId];

    if (!response.ok) {
      throw new Error(
        `Failed to fetch "${url.href}" with ${response.status} status (${response.statusText})`,
      );
    }

    return {
      value: {
        body: responseBody,
        status: response.status,
        headers: Object.fromEntries(response.headers),
      },
    };
  }

  destroy(): void {
    Object.values(this.fetchs).forEach((item) => {
      clearTimeout(item.timeout);
      item.controller.abort(new Error('STOPPED'));
    });

    this.fetchs = {};
  }
}
