import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import type {
  WorkflowNodeHandlerExecute,
  WorkflowNodeHandlerExecuteReturn,
} from './WorkflowNodeHandler';
import WorkflowNodeHandler from './WorkflowNodeHandler';
import fs from 'fs-extra';
import { globby } from 'globby';
import WorkflowFileHandle from '../utils/WorkflowFileHandle';

type ExecuteParams = WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.FILE_SYSTEM>;

export class NodeHandlerFileSystem extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.FILE_SYSTEM> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.FILE_SYSTEM, {
      dataValidation: [
        {
          key: 'readFilePath',
          name: 'Read file path pattern',
          types: ['String'],
        },
        { key: 'writeFilePath', name: 'Write file path', types: ['String'] },
      ],
    });
  }

  private async readFile({
    node,
    runner,
  }: Pick<ExecuteParams, 'node' | 'runner'>) {
    const files = await globby(node.data.readFilePath, { gitignore: false });
    if (files.length === 0 && node.data.throwIfEmpty) {
      throw new Error("Couldn't find files with inputted patterns");
    }

    const filesHandle = await Promise.all(
      files.map(async (filePath) => {
        const fileStat = await fs.stat(filePath);

        return new WorkflowFileHandle({
          path: filePath,
          size: fileStat.size,
          lastModified: fileStat.mtime.toString(),
        });
      }),
    );

    if (node.data.insertToVar) {
      runner.dataStorage.variables.set(node.data.varName, filesHandle);
    }

    return filesHandle;
  }

  async execute({
    node,
    runner,
  }: ExecuteParams): Promise<WorkflowNodeHandlerExecuteReturn> {
    let value: unknown = null;

    if (node.data.action === 'read') {
      value = await this.readFile({ node, runner });
    } else if (node.data.action === 'write') {
      if (node.data.appendFile) {
        await fs.appendFile(node.data.writeFilePath, node.data.fileData);
      } else {
        await fs.writeFile(node.data.writeFilePath, node.data.fileData);
      }
    }

    return {
      value,
    };
  }

  destroy() {}
}
