import { Injectable } from '@nestjs/common';
import { DBService } from '/@/db/db.service';
import {
  WorkflowHistoryInsertPayload,
  WorkflowHistoryListPaginationFilter,
  WorkflowHistoryListPaginationModel,
  WorkflowHistoryRunningItemModel,
  WorkflowHistoryUpdatePayload,
} from './workflow-history.interface';
import { eq, like, asc, desc, count, inArray } from 'drizzle-orm';
import { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { workflowsHistory, workflows } from '/@/db/schema/workflow.schema';
import { DatabaseWorkflowHistory } from '/@/interface/database.interface';
import { withPagination } from '/@/utils/database-utils';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import { WORKFLOW_HISTORY_STATUS } from '#packages/common/utils/constant/workflow.const';

@Injectable()
export class WorkflowHistoryService {
  constructor(private dbService: DBService) {}

  async listHistoryPagination({
    sort,
    filter,
    pagination,
  }: WorkflowHistoryListPaginationFilter = {}): Promise<WorkflowHistoryListPaginationModel> {
    let query = this.dbService.db
      .select({
        id: workflowsHistory.id,
        status: workflowsHistory.status,
        endedAt: workflowsHistory.endedAt,
        runnerId: workflowsHistory.runnerId,
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
          await this.dbService.db
            .select({ count: count() })
            .from(workflowsHistory)
        )[0].count;

    return {
      items,
      count: historyLength,
    };
  }

  async insertHistory({
    status,
    endedAt,
    duration,
    runnerId,
    startedAt,
    workflowId,
    errorMessage,
    errorLocation,
  }: WorkflowHistoryInsertPayload) {
    const result = await this.dbService.db
      .insert(workflowsHistory)
      .values({
        status,
        duration,
        runnerId,
        workflowId,
        errorMessage,
        errorLocation,
        endedAt: endedAt && new Date(endedAt).toISOString(),
        startedAt: startedAt
          ? new Date(startedAt).toISOString()
          : new Date().toISOString(),
      })
      .returning();

    this.dbService.emitChanges({
      'database:get-running-workflows': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-workflow-history-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result;
  }

  async updateHistory(
    historyId: number,
    {
      status,
      endedAt,
      duration,
      errorMessage,
      errorLocation,
    }: WorkflowHistoryUpdatePayload,
  ) {
    const result = await this.dbService.db
      .update(workflowsHistory)
      .set({ duration, endedAt, errorLocation, errorMessage, status })
      .where(eq(workflowsHistory.id, historyId))
      .returning();

    this.dbService.emitChanges({
      'database:get-running-workflows': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-workflow-history-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result;
  }

  async deleteHistory(historyId: number[] | number) {
    await this.dbService.db
      .delete(workflowsHistory)
      .where(
        Array.isArray(historyId)
          ? inArray(workflowsHistory.id, historyId)
          : eq(workflowsHistory.id, historyId),
      );

    this.dbService.emitChanges({
      'database:get-running-workflows': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-workflow-history-list': [DATABASE_CHANGES_ALL_ARGS],
    });
  }

  listRunningWorkflows(): Promise<WorkflowHistoryRunningItemModel[]> {
    return this.dbService.db.query.workflowsHistory.findMany({
      columns: {
        runnerId: true,
        startedAt: true,
      },
      with: {
        workflow: {
          columns: {
            name: true,
            icon: true,
          },
        },
      },
      where(fields, operators) {
        return operators.eq(fields.status, WORKFLOW_HISTORY_STATUS.Running);
      },
    });
  }
}
