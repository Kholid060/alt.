import {
  WorkflowHistoryWithWorkflowModel,
  WorkflowHistoryLogItem,
} from '#packages/main/src/workflow/workflow-history/workflow-history.interface';
import { WORKFLOW_NODES } from '@altdot/workflow';
import { ArrowUpRightIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import clsx from 'clsx';

const logLevelClass: Record<string, string> = {
  default: 'hover:bg-card',
  error: 'hover:bg-destructive/25 bg-destructive/20 text-destructive-text',
};
function WorkflowHistoryDetail({
  history,
  className,
  onNodeClicked,
  ...props
}: {
  history: WorkflowHistoryWithWorkflowModel;
  onNodeClicked?: (nodeId: string) => void;
} & React.TableHTMLAttributes<HTMLTableElement>) {
  const [log, setlog] = useState<WorkflowHistoryLogItem[]>([]);

  useEffect(() => {
    preloadAPI.main.ipc
      .invokeWithError('workflow-history:get-log', history.runnerId)
      .then(setlog);
  }, [history.runnerId]);

  return (
    <table
      className={clsx(
        'h-full w-full align-top font-mono text-muted-foreground',
        className,
      )}
      {...props}
    >
      <thead>
        <tr>
          <th className="w-32"></th>
          <th className="w-40"></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {log.length === 0 && (
          <tr>
            <td colSpan={99} className="text-center">
              No log data
            </td>
          </tr>
        )}
        {log.map((item) => (
          <tr
            key={item.id}
            className={
              'align-top ' +
              (logLevelClass[item.level] ?? logLevelClass.default)
            }
          >
            <td className="py-1.5 pl-6 pr-2">{item.time}</td>
            <td className="line-clamp-1 px-2 py-1.5">
              {item.node && (
                <button
                  title={
                    (WORKFLOW_NODES[item.node.type]?.title ?? item.node.type) +
                    ' node'
                  }
                  className="hover:text-foreground"
                  onClick={() => onNodeClicked?.(item.node?.id ?? '')}
                >
                  <ArrowUpRightIcon className="mr-1 inline-block size-4 align-middle" />
                  <span className="align-middle">
                    {WORKFLOW_NODES[item.node.type]?.title ?? item.node.type}
                  </span>
                </button>
              )}
            </td>
            <td className="py-1.5 pl-2 pr-6">
              {item.msg}
              {item.args ? ` ${item.args.join(' ')}` : ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default WorkflowHistoryDetail;
