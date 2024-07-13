import { Operators } from 'drizzle-orm';
import { WorkflowHistoryFindById } from './workflow-history.interface';
import { workflowsHistory } from '/@/db/schema/workflow.schema';

export function findWorkflowHistoryByIdQuery(
  id: WorkflowHistoryFindById | WorkflowHistoryFindById[],
) {
  return (fields: typeof workflowsHistory._.columns, operators: Operators) => {
    if (Array.isArray(id)) {
      const ids: number[] = [];
      const runnerIds: string[] = [];

      id.forEach((item) => {
        if (typeof item === 'number') ids.push(item);
        else runnerIds.push(item.runnerId);
      });

      if (ids.length && runnerIds.length) {
        return operators.or(
          operators.inArray(fields.id, ids),
          operators.inArray(fields.runnerId, runnerIds),
        );
      }

      return ids.length
        ? operators.inArray(fields.id, ids)
        : operators.inArray(fields.runnerId, runnerIds);
    }

    if (typeof id === 'number') return operators.eq(fields.id, id);

    return operators.eq(fields.runnerId, id.runnerId);
  };
}
