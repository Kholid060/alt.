import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import type {
  WorkflowEdge,
  WorkflowNodeTrigger,
  WorkflowNodes,
  WorkflowSettings,
} from '#common/interface/workflow.interface';
import type { Viewport } from 'reactflow';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

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
  executeCount: integer('execute_count').notNull().default(0),
  settings: text('settings', { mode: 'json' }).$type<WorkflowSettings>(),
});
export type NewWorkflow = typeof workflows.$inferInsert;
export type SelectWorkflow = typeof workflows.$inferSelect;
