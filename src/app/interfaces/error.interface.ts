export type TErrorSources = {
  path: string | number;
  message: string;
};

export type TErrorResponse = {
  success: false;
  message: string;
  errorSources: TErrorSources[];
  error?: unknown;
  stack?: string;
};