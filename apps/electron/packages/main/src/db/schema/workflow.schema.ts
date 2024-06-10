import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import type {
  WorkflowEdge,
  WorkflowSettings,
  WorkflowVariable,
} from '#common/interface/workflow.interface';
import type { Viewport } from 'reactflow';
import { relations, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type {
  WorkflowNodeTrigger,
  WorkflowNodes,
} from '#common/interface/workflow-nodes.interface';
import type { WORKFLOW_HISTORY_STATUS } from '#common/utils/constant/workflow.const';

export const workflows = sqliteTable('workflows', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text('name').notNull(),
  icon: text('icon'),
  description: text('description'),
  nodes: text('nodes', { mode: 'json' })
    .notNull()
    .default(sql`(json_array())`)
    .$type<WorkflowNodes[]>(),
  viewport: text('viewport', { mode: 'json' }).$type<Viewport>(),
  edges: text('edges', { mode: 'json' })
    .notNull()
    .default(sql`(json_array())`)
    .$type<WorkflowEdge[]>(),
  triggers: text('triggers', { mode: 'json' })
    .notNull()
    .default(sql`(json_array())`)
    .$type<WorkflowNodeTrigger[]>(),
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
  settings: text('settings', { mode: 'json' }).$type<WorkflowSettings>(),
});
export type NewWorkflow = typeof workflows.$inferInsert;
export type SelectWorkflow = typeof workflows.$inferSelect;

export const workflowsRelations = relations(workflows, ({ many }) => ({
  history: many(workflowsHistory),
}));

export const workflowsHistory = sqliteTable('workflows_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startedAt: text('started_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  endedAt: text('ended_at'),
  duration: integer('duration'),
  errorMessage: text('error_message'),
  runnerId: text('runner_id').notNull(),
  errorLocation: text('error_location'),
  workflowId: text('workflow_id').notNull(),
  status: text('status').notNull().$type<WORKFLOW_HISTORY_STATUS>(),
});
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
