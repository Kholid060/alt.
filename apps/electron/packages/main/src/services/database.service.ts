import { and, eq, notInArray } from 'drizzle-orm';
import extensionsDB from '../db/extension.db';
import type {
  NewExtension,
  NewExtensionCommand,
  SelectExtensionConfig,
  SelectExtensionStorage,
} from '../db/schema/extension.schema';
import {
  extensions,
  commands as commandsSchema,
} from '../db/schema/extension.schema';
import WindowsManager from '../window/WindowsManager';
import type { ExtensionCommand, ExtensionManifest } from '@repo/extension-core';
import {
  buildConflictUpdateColumns,
  mapManifestToDB,
} from '../utils/database-utils';
import type {
  DatabaseExtension,
  DatabaseExtensionCommandWithExtension,
  DatabaseExtensionListItem,
  DatabaseExtensionUpdatePayload,
  DatabaseQueriesEvent,
} from '../interface/database.interface';

class DatabaseService {
  static async getExtensions(): Promise<DatabaseExtensionListItem[]> {
    const extensionsDbData = await extensionsDB.query.extensions.findMany({
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
    });

    return extensionsDbData;
  }

  static async getExtension(
    extensionId: string,
  ): Promise<DatabaseExtension | null> {
    const extension = await extensionsDB.query.extensions.findFirst({
      with: { commands: {} },
      where(fields, operators) {
        return operators.eq(fields.id, extensionId);
      },
    });

    return extension ?? null;
  }

  static getCommands() {
    return extensionsDB.query.commands.findMany({
      with: {
        extension: {
          columns: { isError: true, isDisabled: true },
        },
      },
    });
  }

  static async getExtensionManifest(
    extensionId: string,
  ): Promise<ExtensionManifest | null> {
    const extension = await extensionsDB.query.extensions.findFirst({
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

  static async getExtensionCommand(
    query: string | { commandId: string; extensionId: string },
  ): Promise<DatabaseExtensionCommandWithExtension | null> {
    const commandId =
      typeof query === 'string'
        ? query
        : `${query.extensionId}:${query.commandId}`;
    const result = await extensionsDB.query.commands.findFirst({
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

  static getCommandsByExtensionId(extensionId: string) {
    return extensionsDB.query.commands.findMany({
      where(fields, operators) {
        return operators.eq(fields.extensionId, extensionId);
      },
    });
  }

  static async updateExtension(
    extensionId: string,
    { isDisabled }: DatabaseExtensionUpdatePayload,
  ) {
    await extensionsDB
      .update(extensions)
      .set({ isDisabled, updatedAt: new Date().toISOString() })
      .where(eq(extensions.id, extensionId));

    this.emitDBChanges({
      'database:get-extension-list': [],
      'database:get-extension': [extensionId],
    });
  }

  static emitDBChanges(
    changes: {
      [T in keyof Partial<DatabaseQueriesEvent>]: Parameters<
        DatabaseQueriesEvent[T]
      >;
    },
    excludeWindow?: number[],
  ) {
    for (const _key in changes) {
      const key = _key as keyof DatabaseQueriesEvent;
      WindowsManager.instance.sendMessageToAllWindows({
        name: 'database:changes',
        excludeWindow,
        args: [key, ...(changes[key] ?? [])],
      });
    }
  }

  static async upsertExtensionCommands(
    extensionId: string,
    commands: ExtensionCommand[],
    tx?: Parameters<Parameters<typeof extensionsDB.transaction>[0]>[0],
  ) {
    const db = tx || extensionsDB;

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

  static async configExists(configId: string) {
    return Boolean(
      await extensionsDB.query.configs.findFirst({
        columns: {
          configId: true,
        },
        where(fields, operators) {
          return operators.eq(fields.configId, configId);
        },
      }),
    );
  }

  static async getConfigs(
    configId: string,
  ): Promise<SelectExtensionConfig | undefined>;
  static async getConfigs(configId: string[]): Promise<SelectExtensionConfig[]>;
  static async getConfigs(configIds: string | string[]): Promise<unknown> {
    if (Array.isArray(configIds)) {
      return await extensionsDB.query.configs.findMany({
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

    return await extensionsDB.query.configs.findFirst({
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

  static async getStorage(
    keys: string[],
    extensionId: string,
  ): Promise<Pick<SelectExtensionStorage, 'key' | 'value'>[]>;
  static async getStorage(
    keys: string,
    extensionId: string,
  ): Promise<Pick<SelectExtensionStorage, 'key' | 'value'> | undefined>;
  static async getStorage(
    keys: string | string[],
    extensionId: string,
  ): Promise<unknown> {
    if (typeof keys === 'string') {
      const result = await extensionsDB.query.storages.findFirst({
        columns: {
          key: true,
          value: true,
        },
        where: (fields, { eq, and }) =>
          and(eq(fields.extensionId, extensionId), eq(fields.key, keys)),
      });

      return result;
    }

    const result = await extensionsDB.query.storages.findMany({
      columns: {
        key: true,
        value: true,
      },
      where: (fields, { inArray, and, eq }) =>
        and(eq(fields.extensionId, extensionId), inArray(fields.key, keys)),
    });

    return result;
  }

  static async getAllExtensionStorage(extensionId: string) {
    const result = await extensionsDB.query.storages.findMany({
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

  static async addExtension(
    extensionData: NewExtension,
    commandsData: NewExtensionCommand[],
  ): Promise<DatabaseExtension> {
    await extensionsDB.insert(extensions).values(extensionData);
    await extensionsDB.insert(commandsSchema).values(commandsData).returning();

    this.emitDBChanges({
      'database:get-extension-list': [],
    });

    const extension = await this.getExtension(extensionData.id);

    return extension!;
  }
}

export default DatabaseService;
