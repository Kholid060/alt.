import APIService from '@/services/api.service';
import { StoreQueryValidation } from '@/validation/store-query.validation';
import { infiniteQueryOptions } from '@tanstack/react-query';

export function storeExtensionQuery(search: StoreQueryValidation) {
  return infiniteQueryOptions<
    Awaited<ReturnType<typeof APIService.instance.store.listExtensions>>
  >({
    initialPageParam: null,
    queryKey: ['store-extensions', search],
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    queryFn: ({ pageParam }) =>
      APIService.instance.store.listExtensions({
        ...search,
        nextCursor: (pageParam as string) ?? undefined,
      }),
  });
}
