export type APISuccessResult<T> =
  | { success: true; data: T }
  | { success: false; data?: null };
