import { Injectable } from '@nestjs/common';
import { DBService } from '/@/db/db.service';
import {
  WorkflowHistoryFindById,
  WorkflowHistoryInsertPayload,
  WorkflowHistoryListPaginationFilter,
  WorkflowHistoryListPaginationModel,
  WorkflowHistoryWithWorkflowModel,
  WorkflowHistoryRunningItemModel,
  WorkflowHistoryUpdatePayload,
  WorkflowHistoryModel,
  WorkflowHistoryLogItem,
  WorkflowHistoryRunningWorkflowFilter,
} from './workflow-history.interface';
import fs from 'fs-extra';
import { eq, like, asc, desc, count, getOperators } from 'drizzle-orm';
import { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { workflowsHistory, workflows } from '/@/db/schema/workflow.schema';
import { withPagination } from '/@/common/utils/database-utils';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import { WORKFLOW_HISTORY_STATUS } from '#packages/common/utils/constant/workflow.const';
import { findWorkflowHistoryByIdQuery } from './utils';
import { OnAppReady } from '/@/common/hooks/on-app-ready.hook';
import path from 'path';
import { WORKFLOW_LOGS_FOLDER } from '/@/common/utils/constant';
import { parseJSON } from '@altdot/shared';
import readline from 'readline';

@Injectable()
export class WorkflowHistoryService implements OnAppReady {
  constructor(private dbService: DBService) {}

  onAppReady() {
    // Reset all running workflow history
    this.dbService.db
      .update(workflowsHistory)
      .set({
        endedAt: new Date().toISOString(),
        status: WORKFLOW_HISTORY_STATUS.Finish,
      })
      .where(eq(workflowsHistory.status, WORKFLOW_HISTORY_STATUS.Running))
      .returning();
  }

  async get(id: WorkflowHistoryFindById): Promise<WorkflowHistoryModel | null> {
    const result = await this.dbService.db.query.workflowsHistory.findFirst({
      where: findWorkflowHistoryByIdQuery(id),
    });

    return result ?? null;
  }

  deleteLogFile(runnerId: string | string[]) {
    const ids = Array.isArray(runnerId) ? runnerId : [runnerId];
    return Promise.allSettled(
      ids.map((id) => fs.remove(path.join(WORKFLOW_LOGS_FOLDER, id))),
    );
  }

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
    if (filter?.workflowId) {
      query = query.where(eq(workflows.id, filter.workflowId));
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

    const items = (await query.execute()) as WorkflowHistoryWithWorkflowModel[];
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
    historyId: WorkflowHistoryFindById,
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
      .where(
        findWorkflowHistoryByIdQuery(historyId)(
          workflowsHistory,
          getOperators(),
        ),
      )
      .returning();

    this.dbService.emitChanges({
      'database:get-running-workflows': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-workflow-history-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result;
  }

  async deleteHistory(
    historyId: WorkflowHistoryFindById[] | WorkflowHistoryFindById,
  ) {
    const ids = await this.dbService.db
      .delete(workflowsHistory)
      .where(
        findWorkflowHistoryByIdQuery(historyId)(
          workflowsHistory,
          getOperators(),
        ),
      )
      .returning();

    this.deleteLogFile(ids.map((id) => id.runnerId));

    this.dbService.emitChanges({
      'database:get-running-workflows': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-workflow-history-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return ids;
  }

  listRunningWorkflows(
    filter?: WorkflowHistoryRunningWorkflowFilter,
  ): Promise<WorkflowHistoryRunningItemModel[]> {
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
        const runningFilter = operators.eq(
          fields.status,
          WORKFLOW_HISTORY_STATUS.Running,
        );
        if (filter?.workflowId) {
          return operators.and(
            runningFilter,
            operators.eq(fields.workflowId, filter.workflowId),
          );
        }

        return runningFilter;
      },
    });
  }

  async getLog(runnerId: string): Promise<WorkflowHistoryLogItem[]> {
    try {
      const logPath = path.join(WORKFLOW_LOGS_FOLDER, `${runnerId}.log`);
      if (!fs.existsSync(logPath)) return [];

      const logItems: WorkflowHistoryLogItem[] = [];

      const fileStream = fs.createReadStream(logPath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });
      for await (const line of rl) {
        const item = parseJSON<WorkflowHistoryLogItem, null>(line);
        if (item) logItems.push(item);
      }

      return logItems;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
}
