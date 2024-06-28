import { Injectable } from '@nestjs/common';
import { DBService } from '../db/db.service';
import { workflows } from '../db/schema/workflow.schema';
import { asc, desc, eq } from 'drizzle-orm';
import {
  WorkflowInsertPayload,
  WorkflowListFilter,
  WorkflowListItemModel,
  WorkflowUpdatePayload,
} from './workflow.interface';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import { nanoid } from 'nanoid';
import { SQLiteColumn } from 'drizzle-orm/sqlite-core';

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
    }: WorkflowUpdatePayload,
  ) {
    const result = await this.dbService.db
      .update(workflows)
      .set({
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
        updatedAt: new Date().toISOString(),
      })
      .where(eq(workflows.id, workflowId))
      .returning();

    this.dbService.emitChanges({
      'database:get-workflow': [workflowId],
      'database:get-workflow-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result;
  }

  listWorkflow(
    filter: WorkflowListFilter = {},
  ): Promise<WorkflowListItemModel[]> {
    let query = this.dbService.db
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

    if (filter.sort) {
      let sortColumn: SQLiteColumn | null = null;

      switch (filter.sort.by) {
        case 'executeCount':
          sortColumn = workflows.executeCount;
          break;
        case 'updatedAt':
          sortColumn = workflows.updatedAt;
          break;
      }

      if (sortColumn) {
        query = query.orderBy(
          filter.sort.asc ? asc(sortColumn) : desc(sortColumn),
        );
      }
    }

    if (filter.limit) query = query.limit(filter.limit);
    if (typeof filter.isPinned === 'boolean') {
      query = query.where(eq(workflows.isPinned, filter.isPinned));
    }

    return query.execute();
  }
}
