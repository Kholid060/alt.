import { Injectable } from '@nestjs/common';
import { DBService } from '../db/db.service';
import { workflows } from '../db/schema/workflow.schema';
import { eq } from 'drizzle-orm';
import { WorkflowInsertPayload } from './workflow.interface';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import { nanoid } from 'nanoid';

@Injectable()
export class WorkflowQueryService {
  constructor(private dbService: DBService) {}

  async delete(workflowId: string) {
    const value = await this.dbService.db
      .delete(workflows)
      .where(eq(workflows.id, workflowId))
      .returning();

    this.dbService.emitChanges({
      'database:get-workflow': [workflowId],
      'database:get-workflow-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return value;
  }

  async get(workflowId: string) {
    const result = await this.dbService.db.query.workflows.findFirst({
      where(fields, operators) {
        return operators.eq(fields.id, workflowId);
      },
    });

    return result ?? null;
  }

  async insert(workflow: WorkflowInsertPayload) {
    const workflowId = nanoid();
    const newWorkflows = Array.isArray(workflow) ? workflow : [workflow];

    const result = await this.dbService.db
      .insert(workflows)
      .values(
        newWorkflows.map((item) => ({
          ...item,
          id: workflowId,
        })),
      )
      .returning();

    this.dbService.emitChanges({
      'database:get-workflow-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result;
  }
}
