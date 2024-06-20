import { ExtensionCreatePayload } from '@/interface/extension.interface';
import APIService from '../api.service';
import { AdminExtensionListItem } from '@/interface/admin.interface';
import { APISuccessResult } from '@/interface/api.interface';

export type AdminSetExtentionEntryPayload =
  | { type: 'rejected'; reason: string }
  | {
      type: 'approved';
      extension: Partial<ExtensionCreatePayload & { downloadUrl: string }>;
    };

class APIAdminNamespace {
  constructor(private api: APIService) {}

  listExtensions() {
    return this.api.authorizeFetch<AdminExtensionListItem[]>(
      '/admin/extensions',
    );
  }

  setExtensionEntry(
    {
      entryId,
      extensionId,
    }: {
      extensionId: string;
      entryId: number;
    },
    payload: AdminSetExtentionEntryPayload,
  ) {
    return this.api.authorizeFetch<APISuccessResult<null>>(
      `/admin/extensions/${extensionId}/entries/${entryId}/request`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  }
}

export default APIAdminNamespace;
