import { eq } from 'drizzle-orm';
import type { SQLiteDatabase } from './database.service';
import type { SelectWorkflow } from '/@/db/schema/workflow.schema';
import { workflows } from '/@/db/schema/workflow.schema';
import type {
  DatabaseWorkflow,
  DatabaseWorkflowDetail,
  DatabaseWorkflowInsertPayload,
  DatabaseWorkflowUpdatePayload,
} from '/@/interface/database.interface';
import { nanoid } from 'nanoid';
import { emitDBChanges } from '/@/utils/database-utils';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';

class DBWorkflowService {
  constructor(private database: SQLiteDatabase) {}

  list(): Promise<DatabaseWorkflow[]> {
    return this.database.query.workflows.findMany({
      columns: {
        id: true,
        icon: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        isDisabled: true,
        description: true,
      },
    });
  }

  async get(workflowId: string): Promise<DatabaseWorkflowDetail | null> {
    const result = await this.database.query.workflows.findFirst({
      where(fields, operators) {
        return operators.eq(fields.id, workflowId);
      },
    });

    return result ?? null;
  }

  async insert(workflow: DatabaseWorkflowInsertPayload) {
    await this.database.insert(workflows).values({
      ...workflow,
      id: nanoid(),
    });

    emitDBChanges({
      'database:get-workflow-list': DATABASE_CHANGES_ALL_ARGS,
    });
  }

  async update(
    workflowId: string,
    {
      icon,
      name,
      edges,
      nodes,
      settings,
      triggers,
      viewport,
      isDisabled,
      description,
    }: DatabaseWorkflowUpdatePayload,
    {
      excludeEmit,
      ignoreModified = false,
    }: Partial<{ ignoreModified: boolean; excludeEmit?: number[] }>,
  ) {
    const payload: Partial<SelectWorkflow> = {
      icon,
      name,
      edges,
      nodes,
      settings,
      triggers,
      viewport,
      isDisabled,
      description,
    };
    if (!ignoreModified) payload.updatedAt = new Date().toISOString();

    await this.database
      .update(workflows)
      .set(payload)
      .where(eq(workflows.id, workflowId));

    emitDBChanges(
      {
        'database:get-workflow': [workflowId],
        'database:get-workflow-list': DATABASE_CHANGES_ALL_ARGS,
      },
      excludeEmit,
    );
  }

  async delete(id: string) {
    await this.database.delete(workflows).where(eq(workflows.id, id));

    emitDBChanges({
      'database:get-workflow': [id],
      'database:get-workflow-list': DATABASE_CHANGES_ALL_ARGS,
    });
  }
}

export default DBWorkflowService;
