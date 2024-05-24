import { asc, count, desc, eq, inArray, like, sql } from 'drizzle-orm';
import type { SQLiteDatabase } from './database.service';
import type { SelectWorkflow } from '/@/db/schema/workflow.schema';
import { workflows, workflowsHistory } from '/@/db/schema/workflow.schema';
import type {
  DatabaseWorkflow,
  DatabaseWorkflowDetail,
  DatabaseWorkflowHistory,
  DatabaseWorkflowHistoryInsertPayload,
  DatabaseWorkflowHistoryListOptions,
  DatabaseWorkflowHistoryUpdatePayload,
  DatabaseWorkflowInsertPayload,
  DatabaseWorkflowUpdatePayload,
  DatabaseWorkfowListQueryOptions,
} from '/@/interface/database.interface';
import { nanoid } from 'nanoid';
import { emitDBChanges, withPagination } from '/@/utils/database-utils';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

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

  async getExportValue(workflowId: string) {
    const result = await this.database.query.workflows.findFirst({
      columns: {
        icon: true,
        name: true,
        nodes: true,
        edges: true,
        settings: true,
        viewport: true,
        variables: true,
        description: true,
      },
      where(fields, operators) {
        return operators.eq(fields.id, workflowId);
      },
    });

    return result ?? null;
  }

  getAll(): Promise<DatabaseWorkflowDetail[]> {
    return this.database.query.workflows.findMany();
  }

  async insert(
    workflow: DatabaseWorkflowInsertPayload | DatabaseWorkflowInsertPayload[],
  ) {
    const workflowId = nanoid();
    const newWorkflows = Array.isArray(workflow) ? workflow : [workflow];

    await this.database.insert(workflows).values(
      newWorkflows.map((item) => ({
        ...item,
        id: workflowId,
      })),
    );

    emitDBChanges({
      'database:get-workflow-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return workflowId;
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
      variables,
      isDisabled,
      description,
    }: DatabaseWorkflowUpdatePayload,
    {
      excludeEmit,
      ignoreModified = false,
    }: Partial<{ ignoreModified: boolean; excludeEmit?: number[] }> = {},
  ) {
    const payload: Partial<SelectWorkflow> = {
      icon,
      name,
      edges,
      nodes,
      settings,
      triggers,
      viewport,
      variables,
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
        'database:get-workflow-list': [DATABASE_CHANGES_ALL_ARGS],
      },
      excludeEmit,
    );
  }

  async delete(id: string) {
    this.database.transaction(async (tx) => {
      await tx.delete(workflows).where(eq(workflows.id, id));
      await tx
        .delete(workflowsHistory)
        .where(eq(workflowsHistory.workflowId, id));
    });

    emitDBChanges({
      'database:get-workflow': [id],
      'database:get-workflow-list': [DATABASE_CHANGES_ALL_ARGS],
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

  async insertHistory({
    status,
    endedAt,
    duration,
    startedAt,
    workflowId,
    errorMessage,
    errorLocation,
  }: DatabaseWorkflowHistoryInsertPayload) {
    const result = await this.database.insert(workflowsHistory).values({
      status,
      duration,
      workflowId,
      errorMessage,
      errorLocation,
      endedAt: endedAt && new Date(endedAt).toISOString(),
      startedAt: startedAt
        ? new Date(startedAt).toISOString()
        : new Date().toISOString(),
    });

    emitDBChanges({
      'database:get-workflow-history-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result.lastInsertRowid as number;
  }

  async getHistory(historyId: number): Promise<DatabaseWorkflowHistory | null> {
    const result = await this.database.query.workflowsHistory.findFirst({
      where(fields, operators) {
        return operators.eq(fields.id, historyId);
      },
      with: {
        workflow: { columns: { name: true, description: true } },
      },
    });
    return result ?? null;
  }

  async updateHistory(
    historyId: number,
    {
      status,
      endedAt,
      duration,
      errorMessage,
      errorLocation,
    }: DatabaseWorkflowHistoryUpdatePayload,
  ) {
    await this.database
      .update(workflowsHistory)
      .set({ duration, endedAt, errorLocation, errorMessage, status })
      .where(eq(workflowsHistory.id, historyId));

    emitDBChanges({
      'database:get-workflow-history': [historyId],
      'database:get-workflow-history-list': [DATABASE_CHANGES_ALL_ARGS],
    });
  }

  async listHistory({
    sort,
    filter,
    pagination,
  }: DatabaseWorkflowHistoryListOptions = {}): Promise<{
    count: number;
    items: DatabaseWorkflowHistory[];
  }> {
    let query = this.database
      .select({
        id: workflowsHistory.id,
        status: workflowsHistory.status,
        endedAt: workflowsHistory.endedAt,
        duration: workflowsHistory.duration,
        startedAt: workflowsHistory.startedAt,
        workflowId: workflowsHistory.workflowId,
        errorMessage: workflowsHistory.errorMessage,
        errorLocation: workflowsHistory.errorLocation,
        workflow: {
          name: workflows.name,
          description: workflows.description,
        },
      })
      .from(workflowsHistory)
      .leftJoin(workflows, eq(workflows.id, workflowsHistory.workflowId))
      .$dynamic();

    if (filter?.name) {
      query = query.where(like(workflows.name, `%${filter.name}%`));
    }
    if (sort) {
      let sortColumn: SQLiteColumn = workflowsHistory.id;
      switch (sort.by) {
        case 'startedAt':
          sortColumn = workflowsHistory.startedAt;
          break;
        case 'duration':
          sortColumn = workflowsHistory.duration;
          break;
        case 'name':
          sortColumn = workflows.name;
          break;
      }

      query = query.orderBy(sort.asc ? asc(sortColumn) : desc(sortColumn));
    }
    if (pagination) {
      query = withPagination(query, pagination.page, pagination.pageSize);
    }

    const items = (await query.execute()) as DatabaseWorkflowHistory[];
    const historyLength = filter
      ? items.length
      : (
          await this.database.select({ count: count() }).from(workflowsHistory)
        )[0].count;

    return {
      items,
      count: historyLength,
    };
  }

  async commandExist(ids: string[]) {
    const queryResult = await this.database.query.extensionCommands.findMany({
      columns: {
        id: true,
      },
      where(fields, operators) {
        return operators.inArray(fields.id, ids);
      },
    });

    const commandIds = new Set(queryResult.map((item) => item.id));
    const result = ids.reduce<Record<string, boolean>>((acc, curr) => {
      acc[curr] = commandIds.has(curr);
      return acc;
    }, {});

    return result;
  }

  async deleteHistory(historyId: number | number[]) {
    await this.database
      .delete(workflowsHistory)
      .where(
        Array.isArray(historyId)
          ? inArray(workflowsHistory.id, historyId)
          : eq(workflowsHistory.id, historyId),
      );

    emitDBChanges({
      'database:get-workflow-history': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-workflow-history-list': [DATABASE_CHANGES_ALL_ARGS],
    });
  }
}

export default DBWorkflowService;
