import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type {
  WorkflowEdge,
  WorkflowNodeTrigger,
  WorkflowNodes,
  WorkflowSettings,
} from '#common/interface/workflow.interface';
import type { Viewport } from 'reactflow';
import { sql } from 'drizzle-orm';

export const workflows = sqliteTable('workflows', {
  id: text('id').primaryKey(),
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
  settings: text('settings', { mode: 'json' }).$type<WorkflowSettings>(),
});
export type NewWorkflow = typeof workflows.$inferInsert;
export type SelectWorkflow = typeof workflows.$inferSelect;
