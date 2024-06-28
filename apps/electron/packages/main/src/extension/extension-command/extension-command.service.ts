import { Injectable } from '@nestjs/common';
import { Operators, getOperators } from 'drizzle-orm';
import { extensionCommands } from '/@/db/schema/extension.schema';
import { DBService } from '/@/db/db.service';
import {
  ExtensionCommandListFilter,
  ExtensionCommandListItemModel,
  ExtensionCommandModel,
  ExtensionCommandInsertPayload,
  ExtensionCommandUpdatePayload,
} from './extension-command.interface';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';

type FindByIdParam = string | { commandId: string; extensionId: string };
function findByIdQuery(id: FindByIdParam) {
  return (fields: typeof extensionCommands._.columns, operators: Operators) => {
    if (typeof id === 'string') return operators.eq(fields.id, id);

    return operators.eq(fields.id, `${id.extensionId}:${id.commandId}`);
  };
}

@Injectable()
export class ExtensionCommandService {
  constructor(private dbService: DBService) {}

  async getCommand(id: FindByIdParam): Promise<ExtensionCommandModel | null> {
    const result = await this.dbService.db.query.extensionCommands.findFirst({
      where: findByIdQuery(id),
      with: {
        extension: {
          columns: {
            id: true,
            icon: true,
            title: true,
            isError: true,
            isLocal: true,
            isDisabled: true,
            errorMessage: true,
          },
        },
      },
    });

    return result ?? null;
  }

  listCommands(
    filter: ExtensionCommandListFilter = {},
  ): Promise<ExtensionCommandListItemModel[]> {
    return this.dbService.db.query.extensionCommands.findMany({
      where(fields, operators) {
        if (!filter) return;

        if (filter.type === 'user-script') {
          return operators.and(
            operators.isNotNull(fields.path),
            operators.eq(fields.type, 'script'),
          );
        }
      },
    });
  }

  async insertCommands(commands: ExtensionCommandInsertPayload[]) {
    const result = await this.dbService.db
      .insert(extensionCommands)
      .values(
        commands.map(
          ({
            name,
            type,
            icon,
            path,
            title,
            config,
            context,
            shortcut,
            subtitle,
            isDisabled,
            isFallback,
            extensionId,
            description,
            arguments: commandArgs,
          }) => ({
            id: `${extensionId}:${name}`,
            name,
            type,
            icon,
            path,
            title,
            config,
            context,
            shortcut,
            subtitle,
            isDisabled,
            isFallback,
            extensionId,
            description,
            arguments: commandArgs,
          }),
        ),
      )
      .returning();

    this.dbService.emitChanges({
      'database:get-command-list': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result;
  }

  async updateCommand(
    id: FindByIdParam,
    {
      alias,
      subtitle,
      shortcut,
      isFallback,
      isDisabled,
      customSubtitle,
    }: ExtensionCommandUpdatePayload,
  ) {
    const result = await this.dbService.db
      .update(extensionCommands)
      .set({
        alias,
        shortcut,
        subtitle,
        isFallback,
        isDisabled,
        customSubtitle,
      })
      .where(findByIdQuery(id)(extensionCommands, getOperators()))
      .returning();

    const { extensionId, name: commandId } = result[0];
    this.dbService.emitChanges({
      'database:get-extension': [extensionId],
      'database:get-command': [{ commandId, extensionId }],
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result;
  }

  async deleteCommand(id: FindByIdParam) {
    const result = await this.dbService.db
      .delete(extensionCommands)
      .where(findByIdQuery(id)(extensionCommands, getOperators()));

    this.dbService.emitChanges({
      'database:get-extension': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result;
  }

  async existsArr(ids: FindByIdParam[]) {
    const stringIds = ids.map((id) =>
      typeof id === 'string' ? id : `${id.extensionId}:${id.commandId}`,
    );
    const queryResult =
      await this.dbService.db.query.extensionCommands.findMany({
        columns: {
          id: true,
        },
        where(fields, operators) {
          return operators.inArray(fields.id, stringIds);
        },
      });

    const commandIds = new Set(queryResult.map((item) => item.id));
    const result = stringIds.reduce<Record<string, boolean>>((acc, curr) => {
      acc[curr] = commandIds.has(curr);
      return acc;
    }, {});

    return result;
  }
}
