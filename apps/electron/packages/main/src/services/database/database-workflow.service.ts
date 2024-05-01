import { asc, desc, eq, sql } from 'drizzle-orm';
import type { SQLiteDatabase } from './database.service';
import type { SelectWorkflow } from '/@/db/schema/workflow.schema';
import { workflows } from '/@/db/schema/workflow.schema';
import type {
  DatabaseWorkflow,
  DatabaseWorkflowDetail,
  DatabaseWorkflowInsertPayload,
  DatabaseWorkflowUpdatePayload,
  DatabaseWorkfowListQueryOptions,
} from '/@/interface/database.interface';
import { nanoid } from 'nanoid';
import { emitDBChanges } from '/@/utils/database-utils';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';

class DBWorkflowService {
  constructor(private database: SQLiteDatabase) {}

  list(option?: DatabaseWorkfowListQueryOptions): Promise<DatabaseWorkflow[]> {
    let query = this.database
      .select({
        id: workflows.id,
        icon: workflows.icon,
        name: workflows.name,
        createdAt: workflows.createdAt,
        updatedAt: workflows.updatedAt,
        isDisabled: workflows.isDisabled,
        description: workflows.description,
      })
      .from(workflows)
      .$dynamic();

    if (option === 'commands') {
      query = query
        .orderBy(desc(workflows.executeCount), asc(workflows.updatedAt))
        .limit(10);
    }

    return query.execute();
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

  async incExecuteCount(workflowId: string) {
    this.database
      .update(workflows)
      .set({
        executeCount: sql`${workflows.executeCount} + 1`,
      })
      .where(eq(workflows.id, workflowId));
  }
}

export default DBWorkflowService;
