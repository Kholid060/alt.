import { QueryClient } from '@tanstack/react-query';
import { LoaderFunction } from 'react-router-dom';

export type APISuccessResult<T> =
  | { success: true; data: T }
  | { success: false; data?: null };

export type APIRouteLoaderFunc = (queryClient: QueryClient) => LoaderFunction;
