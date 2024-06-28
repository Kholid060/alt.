import { Controller } from '@nestjs/common';
import { ExtensionCommandService } from './extension-command.service';
import type {
  IPCInvokePayload,
  IPCInvokeReturn,
} from '#packages/common/interface/ipc-events.interface';
import { Payload } from '@nestjs/microservices';
import { IPCInvoke } from '/@/common/decorators/ipc.decorator';

@Controller()
export class ExtensionCommandController {
  constructor(private extensionCommand: ExtensionCommandService) {}

  @IPCInvoke('database:get-command')
  async getCommand(
    @Payload()
    [extensionId]: IPCInvokePayload<'database:get-command'>,
  ): IPCInvokeReturn<'database:get-command'> {
    return this.extensionCommand.getCommand(extensionId);
  }

  @IPCInvoke('database:get-command-list')
  async listCommands(
    @Payload()
    [filter]: IPCInvokePayload<'database:get-command-list'>,
  ): IPCInvokeReturn<'database:get-command-list'> {
    return this.extensionCommand.listCommands(filter);
  }

  @IPCInvoke('database:insert-extension-command')
  async insertCommands(
    @Payload()
    [payload]: IPCInvokePayload<'database:insert-extension-command'>,
  ): IPCInvokeReturn<'database:insert-extension-command'> {
    await this.extensionCommand.insertCommands([payload]);
  }

  @IPCInvoke('database:update-extension-command')
  async updateCommand(
    @Payload()
    [
      extensionId,
      commandId,
      payload,
    ]: IPCInvokePayload<'database:update-extension-command'>,
  ): IPCInvokeReturn<'database:update-extension-command'> {
    await this.extensionCommand.updateCommand(
      { commandId, extensionId },
      payload,
    );
  }

  @IPCInvoke('database:delete-extension-command')
  async deleteCommand(
    @Payload()
    [id]: IPCInvokePayload<'database:delete-extension-command'>,
  ): IPCInvokeReturn<'database:delete-extension-command'> {
    await this.extensionCommand.deleteCommand(id);
  }

  @IPCInvoke('database:extension-command-exists')
  async commandExists(
    @Payload()
    [ids]: IPCInvokePayload<'database:extension-command-exists'>,
  ): IPCInvokeReturn<'database:extension-command-exists'> {
    return this.extensionCommand.existsArr(ids);
  }
}
