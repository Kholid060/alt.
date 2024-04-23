import { and, eq, notInArray } from 'drizzle-orm';
import type {
  NewExtension,
  NewExtensionCommand,
  SelectExtensionConfig,
  SelectExtensionStorage,
} from '/@/db/schema/extension.schema';
import {
  extensions,
  commands as commandsSchema,
  commands,
} from '/@/db/schema/extension.schema';
import WindowsManager from '/@/window/WindowsManager';
import type { ExtensionCommand, ExtensionManifest } from '@repo/extension-core';
import {
  buildConflictUpdateColumns,
  mapManifestToDB,
} from '/@/utils/database-utils';
import type {
  DatabaseExtension,
  DatabaseExtensionCommandWithExtension,
  DatabaseExtensionListItem,
  DatabaseExtensionUpdatePayload,
  DatabaseExtensionCommandUpdatePayload,
  DatabaseQueriesEvent,
} from '/@/interface/database.interface';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import type { SQLiteDatabase } from './database.service';

class DBExtensionService {
  constructor(private database: SQLiteDatabase) {}

  async getExtensions(
    activeExtOnly: boolean = false,
  ): Promise<DatabaseExtensionListItem[]> {
    const extensionsDbData = await this.database.query.extensions.findMany({
      columns: {
        id: true,
        icon: true,
        title: true,
        config: true,
        version: true,
        isError: true,
        isLocal: true,
        isDisabled: true,
        description: true,
        errorMessage: true,
      },
      with: {
        commands: {},
      },
      where: activeExtOnly
        ? (fields, operators) => {
            return operators.and(
              operators.eq(fields.isDisabled, false),
              operators.eq(fields.isError, false),
            );
          }
        : undefined,
    });

    return extensionsDbData;
  }

  async getExtension(extensionId: string): Promise<DatabaseExtension | null> {
    const extension = await this.database.query.extensions.findFirst({
      with: { commands: {} },
      where(fields, operators) {
        return operators.eq(fields.id, extensionId);
      },
    });

    return extension ?? null;
  }

  getCommands() {
    return this.database.query.commands.findMany({
      with: {
        extension: {
          columns: { isError: true, isDisabled: true },
        },
      },
    });
  }

  async getExtensionManifest(
    extensionId: string,
  ): Promise<ExtensionManifest | null> {
    const extension = await this.database.query.extensions.findFirst({
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.isError, false),
          operators.eq(fields.id, extensionId),
          operators.eq(fields.isDisabled, false),
        );
      },
      with: {
        commands: {},
      },
    });

    return extension as ExtensionManifest;
  }

  async getExtensionCommand(
    query: string | { commandId: string; extensionId: string },
  ): Promise<DatabaseExtensionCommandWithExtension | null> {
    const commandId =
      typeof query === 'string'
        ? query
        : `${query.extensionId}:${query.commandId}`;
    const result = await this.database.query.commands.findFirst({
      with: {
        extension: {
          columns: {
            id: true,
            icon: true,
            title: true,
            isError: true,
            isDisabled: true,
          },
        },
      },
      where(fields, operators) {
        return operators.eq(fields.id, commandId);
      },
    });

    return result as DatabaseExtensionCommandWithExtension | null;
  }

  getCommandsByExtensionId(extensionId: string) {
    return this.database.query.commands.findMany({
      where(fields, operators) {
        return operators.eq(fields.extensionId, extensionId);
      },
    });
  }

  async updateExtension(
    extensionId: string,
    { isDisabled }: DatabaseExtensionUpdatePayload,
  ) {
    await this.database
      .update(extensions)
      .set({ isDisabled, updatedAt: new Date().toISOString() })
      .where(eq(extensions.id, extensionId));

    this.emitDBChanges({
      'database:get-extension': [extensionId],
      'database:get-extension-list': DATABASE_CHANGES_ALL_ARGS,
    });
  }

  emitDBChanges(
    changes: {
      [T in keyof Partial<DatabaseQueriesEvent>]:
        | typeof DATABASE_CHANGES_ALL_ARGS
        | Parameters<DatabaseQueriesEvent[T]>;
    },
    excludeWindow?: number[],
  ) {
    for (const _key in changes) {
      const key = _key as keyof DatabaseQueriesEvent;
      const params = changes[key];

      WindowsManager.instance.sendMessageToAllWindows({
        name: 'database:changes',
        excludeWindow,
        args: [key, ...(Array.isArray(params) ? params : [params])],
      });
    }
  }

  async upsertExtensionCommands(
    extensionId: string,
    commands: ExtensionCommand[],
    tx?: Parameters<Parameters<typeof this.database.transaction>[0]>[0],
  ) {
    const db = tx || this.database;

    const insertCommandsPayload: NewExtensionCommand[] = commands.map(
      (command) => ({
        id: `${extensionId}:${command.name}`,
        extensionId,
        ...mapManifestToDB.command(command),
      }),
    );

    await db
      .insert(commandsSchema)
      .values(insertCommandsPayload)
      .onConflictDoUpdate({
        target: commandsSchema.id,
        set: buildConflictUpdateColumns(
          commandsSchema,
          Object.keys(
            insertCommandsPayload[0],
          ) as (keyof NewExtensionCommand)[],
        ),
      });

    await db.delete(commandsSchema).where(
      and(
        eq(commandsSchema.extensionId, extensionId),
        notInArray(
          commandsSchema.id,
          insertCommandsPayload.map((command) => command.id),
        ),
      ),
    );
  }

  async configExists(configId: string) {
    return Boolean(
      await this.database.query.configs.findFirst({
        columns: {
          configId: true,
        },
        where(fields, operators) {
          return operators.eq(fields.configId, configId);
        },
      }),
    );
  }

  async getConfigs(
    configId: string,
  ): Promise<SelectExtensionConfig | undefined>;
  async getConfigs(configId: string[]): Promise<SelectExtensionConfig[]>;
  async getConfigs(configIds: string | string[]): Promise<unknown> {
    if (Array.isArray(configIds)) {
      return await this.database.query.configs.findMany({
        columns: {
          id: true,
          value: true,
          configId: true,
          extensionId: true,
        },
        where(fields, operators) {
          return operators.inArray(fields.configId, configIds);
        },
      });
    }

    return await this.database.query.configs.findFirst({
      columns: {
        id: true,
        value: true,
        configId: true,
        extensionId: true,
      },
      where(fields, operators) {
        return operators.eq(fields.configId, configIds);
      },
    });
  }

  async getStorage(
    keys: string[],
    extensionId: string,
  ): Promise<Pick<SelectExtensionStorage, 'key' | 'value'>[]>;
  async getStorage(
    keys: string,
    extensionId: string,
  ): Promise<Pick<SelectExtensionStorage, 'key' | 'value'> | undefined>;
  async getStorage(
    keys: string | string[],
    extensionId: string,
  ): Promise<unknown> {
    if (typeof keys === 'string') {
      const result = await this.database.query.storages.findFirst({
        columns: {
          key: true,
          value: true,
        },
        where: (fields, { eq, and }) =>
          and(eq(fields.extensionId, extensionId), eq(fields.key, keys)),
      });

      return result;
    }

    const result = await this.database.query.storages.findMany({
      columns: {
        key: true,
        value: true,
      },
      where: (fields, { inArray, and, eq }) =>
        and(eq(fields.extensionId, extensionId), inArray(fields.key, keys)),
    });

    return result;
  }

  async getAllExtensionStorage(extensionId: string) {
    const result = await this.database.query.storages.findMany({
      columns: {
        key: true,
        value: true,
      },
      where(fields, { eq }) {
        return eq(fields.extensionId, extensionId);
      },
    });

    return result;
  }

  async updateExtensionCommand(
    extensionId: string,
    commandId: string,
    value: DatabaseExtensionCommandUpdatePayload,
  ) {
    await this.database
      .update(commands)
      .set(value)
      .where(eq(commands.id, `${extensionId}:${commandId}`));

    this.emitDBChanges({
      'database:get-extension': [extensionId],
      'database:get-command': [{ commandId, extensionId }],
      'database:get-extension-list': DATABASE_CHANGES_ALL_ARGS,
    });
  }

  async addExtension(
    extensionData: NewExtension,
    commandsData: NewExtensionCommand[],
  ): Promise<DatabaseExtension> {
    await this.database.insert(extensions).values(extensionData);
    await this.database.insert(commandsSchema).values(commandsData).returning();

    this.emitDBChanges({
      'database:get-extension-list': DATABASE_CHANGES_ALL_ARGS,
    });

    const extension = await this.getExtension(extensionData.id);

    return extension!;
  }
}

export default DBExtensionService;
