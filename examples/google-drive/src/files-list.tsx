import { useEffect, useState } from 'react';
import {
  UiList,
  UiExtIcon,
  UiSkeleton,
  commandRenderer,
  type UiListItem,
  _extension,
} from '@altdot/extension';
import { getToken } from './utils/get-token';
import { apiFetchFiles, type GDFetchFilesResult } from './utils/api';

function getFileLink(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

function ListGDFiles() {
  const [errorMessage, setErrorMessage] = useState('');
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [fetchResult, setFetchResult] = useState<GDFetchFilesResult>({
    files: [],
    kind: 'drive#fileList',
    incompleteSearch: false,
  });

  const listItems: UiListItem[] = fetchResult.files.map((file) => ({
    value: file.id,
    title: file.name,
    subtitle: file.mimeType,
    actions: [
      {
        type: 'button',
        value: 'copy-url',
        title: 'Copy file link',
        icon: UiExtIcon.Clipboard,
        onAction() {
          _extension.clipboard.write('text', getFileLink(file.id)).then(() => {
            const toast = _extension.ui.createToast({
              type: 'success',
              title: 'Copied to clipboard',
            });
            toast.show();
          });
        },
      },
    ],
    icon: <UiList.Icon icon={UiExtIcon.File} />,
  }));

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = await getToken();
        const files = await apiFetchFiles(token.accessToken);

        setStatus('idle');
        setErrorMessage('');
        setFetchResult(files);
      } catch (error) {
        console.error(error);
        setStatus('error');
        setErrorMessage(error.message);
      }
    };
    fetchFiles();
  }, []);

  return (
    <div className="px-2 py-4">
      {status === 'loading' ? (
        <div className="space-y-2">
          <UiSkeleton className="h-10" />
          <UiSkeleton className="h-10" />
          <UiSkeleton className="h-10" />
        </div>
      ) : status === 'error' ? (
        <div className="text-destructive-text">
          <p>Error when fetching files:</p>
          <p>{errorMessage}</p>
        </div>
      ) : (
        <UiList
          items={listItems}
          onItemSelected={(fileId) => {
            _extension.shell.openURL(getFileLink(fileId));
          }}
        />
      )}
    </div>
  );
}

export default commandRenderer(ListGDFiles);
