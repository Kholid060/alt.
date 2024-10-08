import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import type {
  WorkflowSettings,
  WorkflowVariable,
} from '#common/interface/workflow.interface';
import { relations, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { WORKFLOW_HISTORY_STATUS } from '#common/utils/constant/workflow.const';
import type { WorkflowEdges, WorkflowNodes } from '@altdot/workflow';
import type { Viewport } from '@xyflow/react';

export const workflows = sqliteTable('workflows', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  description: text('description'),
  nodes: text('nodes', { mode: 'json' })
    .notNull()
    .default(sql`(json_array())`)
    .$type<WorkflowNodes[]>(),
  viewport: text('viewport', { mode: 'json' }).$type<Viewport>(),
  edges: text('edges', { mode: 'json' })
    .notNull()
    .default(sql`(json_array())`)
    .$type<WorkflowEdges[]>(),
  triggers: text('triggers', { mode: 'json' })
    .notNull()
    .default(sql`(json_array())`)
    .$type<WorkflowNodes[]>(),
  isDisabled: integer('is_disabled', { mode: 'boolean' })
    .notNull()
    .$default(() => false),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  variables: text('variables', { mode: 'json' })
    .notNull()
    .default(sql`(json_array())`)
    .$type<WorkflowVariable[]>(),
  executeCount: integer('execute_count').notNull().default(0),
  dismissAlert: integer('dismiss_alert', { mode: 'boolean' }),
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),
  settings: text('settings', { mode: 'json' }).$type<WorkflowSettings>(),
});
export type NewWorkflow = typeof workflows.$inferInsert;
export type SelectWorkflow = typeof workflows.$inferSelect;

export const workflowsRelations = relations(workflows, ({ many }) => ({
  history: many(workflowsHistory),
}));

export const workflowsHistory = sqliteTable(
  'workflows_history',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    startedAt: text('started_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    endedAt: text('ended_at'),
    duration: integer('duration'),
    errorMessage: text('error_message'),
    runnerId: text('runner_id').notNull(),
    errorLocation: text('error_location'),
    workflowId: text('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
    status: text('status').notNull().$type<WORKFLOW_HISTORY_STATUS>(),
  },
  (table) => ({
    workflowIdIdx: index('workflow_id_idx').on(table.workflowId),
    workflowRunnerIdIdx: index('workflow_runner_id_idx').on(table.runnerId),
  }),
);
export type NewWorkflowHistory = typeof workflowsHistory.$inferInsert;
export type SelectWorkflowHistory = typeof workflowsHistory.$inferSelect;

export const workflowsHistoryRelations = relations(
  workflowsHistory,
  ({ one }) => ({
    workflow: one(workflows, {
      references: [workflows.id],
      fields: [workflowsHistory.workflowId],
    }),
  }),
);
