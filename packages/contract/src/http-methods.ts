export const HTTP_METHOD = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;
export type THttpMethod = (typeof HTTP_METHOD)[keyof typeof HTTP_METHOD];
