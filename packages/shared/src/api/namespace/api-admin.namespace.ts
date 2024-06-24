import API from '../index';
import {
  APISuccessResult,
  ApiAdminExtensionListItem,
  ApiAdminSetExtentionEntryPayload,
} from '../../interfaces/api.interface';

class APIAdminNamespace {
  constructor(private api: API) {}

  listExtensions() {
    return this.api.authorizeFetch<ApiAdminExtensionListItem[]>(
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
    payload: ApiAdminSetExtentionEntryPayload,
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
