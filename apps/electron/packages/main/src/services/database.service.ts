import type {
  DatabaseExtension,
  DatabaseQueriesEvent,
  DatabaseUpdateExtensionPayload,
} from '#packages/common/interface/database.interface';
import type {
  ExtensionDataBase,
  ExtensionLoaderManifestData,
} from '#packages/common/interface/extension.interface';
import { eq } from 'drizzle-orm';
import extensionsDB from '../db/extension.db';
import { extensions } from '../db/schema/extension.schema';
import ExtensionLoader from '../utils/extension/ExtensionLoader';
import WindowsManager from '../window/WindowsManager';

function convertToDbExtension(
  extensionData: ExtensionDataBase,
  manifest: ExtensionLoaderManifestData,
): DatabaseExtension {
  if (manifest.isError) {
    return {
      isError: true,
      errorMessage: manifest.errorMessage,
      ...extensionData,
    };
  }

  return {
    ...extensionData,
    isError: false,
    $key: manifest.$key,
    config: manifest.manifest.config,
    commands: manifest.manifest.commands,
  };
}

class DatabaseService {
  static async getExtensions(): Promise<DatabaseExtension[]> {
    const extensionsDbData = await extensionsDB.query.extensions.findMany({
      columns: {
        id: true,
        name: true,
        icon: true,
        path: true,
        title: true,
        version: true,
        isLocal: true,
        isDisabled: true,
        description: true,
      },
    });

    const extensions: DatabaseExtension[] = [];
    extensionsDbData.forEach((extension) => {
      const manifest = ExtensionLoader.instance.getManifest(extension.id);
      if (!manifest) return;

      extensions.push(convertToDbExtension(extension, manifest));
    });

    return extensions;
  }

  static async getExtensionBaseData(extensionId: string) {
    const extensionsDbData = await extensionsDB.query.extensions.findFirst({
      columns: {
        id: true,
        name: true,
        icon: true,
        path: true,
        title: true,
        version: true,
        isLocal: true,
        isDisabled: true,
        description: true,
      },
      where(fields, operators) {
        return operators.eq(fields.id, extensionId);
      },
    });

    return extensionsDbData;
  }

  static async getExtension(extensionId: string) {
    const extensionsDbData = await this.getExtensionBaseData(extensionId);
    if (!extensionsDbData) return null;

    const manifest = ExtensionLoader.instance.getManifest(extensionId);
    if (!manifest) return null;

    return convertToDbExtension(extensionsDbData, manifest);
  }

  static async updateExtension(
    extensionId: string,
    { isDisabled }: DatabaseUpdateExtensionPayload,
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
}

export default DatabaseService;
