import extensionsDB from '../extension.db';
import type {
  SelectExtensionConfig,
  SelectExtensionStorage,
} from '../schema/extension.schema';

class ExtensionsDBController {
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
}

export default ExtensionsDBController;
