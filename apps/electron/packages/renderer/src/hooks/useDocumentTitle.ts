import { APP_NAME } from '#packages/common/utils/constant/app.const';
import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} - ${APP_NAME}`;
  }, [title]);
}
