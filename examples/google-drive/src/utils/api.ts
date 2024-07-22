export interface GDFileMetadata {
  id: string;
  kind: string;
  name: string;
  mimeType: string;
}

export interface GDFetchFilesResult {
  kind: 'drive#fileList';
  nextPageToken?: string;
  files: GDFileMetadata[];
  incompleteSearch: boolean;
}

export async function apiFetchFiles(
  accessToken: string,
): Promise<GDFetchFilesResult> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?access_token=${accessToken}`,
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error?.message || response.statusText);
  }

  return result;
}
