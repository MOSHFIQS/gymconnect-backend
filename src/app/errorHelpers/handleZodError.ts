import { ZodError } from "zod";
import status from "http-status";
import { TErrorResponse } from "../interfaces/error.interface.js";

export const handleZodError = (err: ZodError): TErrorResponse => {
  const errorSources = err.issues.map((issue) => ({
    path: issue.path[issue.path.length - 1] || "",
    message: issue.message,
  }));

  return {
    success: false,
    statusCode: status.BAD_REQUEST,
    message: "Validation Error",
    errorSources,
  } as unknown as TErrorResponse;
};