import { WORKFLOW_NODE_TYPE } from '@alt-dot/workflow';
import type {
  WorkflowNodeHandlerExecute,
  WorkflowNodeHandlerExecuteReturn,
} from './WorkflowNodeHandler';
import WorkflowNodeHandler from './WorkflowNodeHandler';
import fs from 'fs-extra';
import { globby } from 'globby';
import WorkflowFileHandle from '../utils/WorkflowFileHandle';
import type ExtensionAPI from '@alt-dot/extension-core/types/extension-api';

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

  private async readFile({ node }: Pick<ExecuteParams, 'node'>) {
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

    return filesHandle;
  }

  private async writeFile({ node }: Pick<ExecuteParams, 'node'>) {
    if (node.data.appendFile) {
      await fs.appendFile(node.data.writeFilePath, node.data.fileData);
    } else {
      await fs.writeFile(node.data.writeFilePath, node.data.fileData);
    }
  }

  private async stat({
    node,
  }: Pick<ExecuteParams, 'node'>): Promise<ExtensionAPI.fs.Stats[]> {
    const files = await globby(node.data.readFilePath, { gitignore: false });
    if (files.length === 0 && node.data.throwIfEmpty) {
      throw new Error("Couldn't find files with inputted patterns");
    }

    return Promise.all(
      files.map(async (file) => {
        const stat = await fs.stat(file);
        return {
          size: stat.size,
          isFile: stat.isFile(),
          isDirectory: stat.isDirectory(),
          atime: stat.atime.toISOString(),
          mtime: stat.mtime.toISOString(),
          birthtime: stat.birthtime.toISOString(),
        };
      }),
    );
  }

  async execute({
    node,
  }: ExecuteParams): Promise<WorkflowNodeHandlerExecuteReturn> {
    let value: unknown = null;

    switch (node.data.action) {
      case 'read':
        value = await this.readFile({ node });
        break;
      case 'stat':
        value = await this.readFile({ node });
        break;
      case 'write':
        await this.writeFile({ node });
    }

    return {
      value,
    };
  }

  destroy() {}
}
