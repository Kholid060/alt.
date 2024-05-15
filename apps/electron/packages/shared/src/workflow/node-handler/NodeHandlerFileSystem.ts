import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import type {
  WorkflowNodeHandlerExecute,
  WorkflowNodeHandlerExecuteReturn,
} from './WorkflowNodeHandler';
import WorkflowNodeHandler from './WorkflowNodeHandler';
import fs from 'fs-extra';
import WorkflowFileHandle from '../utils/WorkflowFileHandle';

type ExecuteParams = WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.FILE_SYSTEM>;

export class NodeHandlerFileSystem extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.FILE_SYSTEM> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.FILE_SYSTEM, {
      dataValidation: [
        { key: 'filePath', name: 'File path', types: ['String'] },
      ],
    });
  }

  private async readFile({
    node,
    runner,
  }: Pick<ExecuteParams, 'node' | 'runner'>) {
    const fileExists = fs.existsSync(node.data.filePath);
    if (!fileExists) {
      throw new Error(`Couldn't find a file at "${node.data.filePath}"`);
    }

    const fileStat = await fs.stat(node.data.filePath);
    const fileHandle = new WorkflowFileHandle({
      size: fileStat.size,
      path: node.data.filePath,
      lastModified: fileStat.mtime.toString(),
    });

    if (node.data.insertToVar) {
      runner.dataStorage.variables.set(node.data.varName, fileHandle);
    }

    return fileHandle;
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
        await fs.appendFile(node.data.filePath, node.data.fileData);
      } else {
        await fs.writeFile(node.data.filePath, node.data.fileData);
      }
    }

    return {
      value,
    };
  }

  destroy() {}
}
