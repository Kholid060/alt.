import { WORKFLOW_NODE_TYPE } from '@altdot/workflow/dist/const/workflow-nodes-type.const';
import { z } from 'zod';

export const workflowFileValidation = z.object({
  name: z.string().min(1),
  icon: z.string().min(1),
  nodes: z
    .object({
      id: z.string(),
      data: z.record(z.string(), z.unknown()),
      type: z.nativeEnum(WORKFLOW_NODE_TYPE),
      position: z.object({ x: z.number(), y: z.number() }),
    })
    .array(),
  edges: z
    .object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      sourceHandle: z.string().nullable().optional(),
      targetHandle: z.string().nullable().optional(),
    })
    .array(),
  viewport: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number(),
    })
    .nullable()
    .optional(),
  variables: z
    .object({ id: z.string().min(1), name: z.string(), value: z.string() })
    .array(),
  description: z.string().default('').optional(),
});
export type WorkflowFileModel = z.infer<typeof workflowFileValidation>;
