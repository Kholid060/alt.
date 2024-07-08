import { Injectable } from '@nestjs/common';
import { WebAppNamespace } from './web-app.interface';
import { DBService } from '../db/db.service';
import {
  ApiWorkflowEdge,
  ApiWorkflowNode,
  WebAppWorkflow,
  WebAppWorkflowListItem,
} from '@altdot/shared';

@Injectable()
export class WebAppService {
  private server?: WebAppNamespace;

  constructor(private dbService: DBService) {}

  setSocket(server: WebAppNamespace) {
    this.server = server;
  }

  listWorkflows(): Promise<WebAppWorkflowListItem[]> {
    return this.dbService.db.query.workflows.findMany({
      columns: {
        id: true,
        name: true,
        icon: true,
        description: true,
      },
    });
  }

  async getWorkflow(
    workflowId: string,
  ): Promise<WebAppWorkflow | { notFound: true }> {
    const item = await this.dbService.db.query.workflows.findFirst({
      columns: {
        id: true,
        name: true,
        icon: true,
        nodes: true,
        edges: true,
        variables: true,
        description: true,
      },
      where(fields, operators) {
        return operators.eq(fields.id, workflowId);
      },
    });
    if (!item) return { notFound: true };

    return {
      readme: '',
      id: item.id,
      categories: [],
      icon: item.icon,
      name: item.name,
      description: item.description,
      workflow: {
        variables: item.variables ?? [],
        edges: item.edges as ApiWorkflowEdge[],
        nodes: item.nodes as ApiWorkflowNode[],
      },
    };
  }
}
