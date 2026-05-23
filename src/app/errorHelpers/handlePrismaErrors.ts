import { Prisma } from "@prisma/client";
import status from "http-status";
import { TErrorResponse } from "../interfaces/error.interface.js";

export const handlePrismaClientKnownRequestError = (
  err: Prisma.PrismaClientKnownRequestError
): TErrorResponse => {
  let message = "Database error";
  const errorSources = [{ path: "", message: "" }];

  if (err.code === "P2002") {
    const fields = (err.meta?.target as string[]) || [];
    message = `Duplicate value for: ${fields.join(", ")}`;
    errorSources[0].message = message;
    errorSources[0].path = fields[0] || "";
  } else if (err.code === "P2025") {
    message = "Record not found";
    errorSources[0].message = message;
  } else if (err.code === "P2003") {
    message = "Foreign key constraint failed";
    errorSources[0].message = message;
  } else {
    message = err.message;
    errorSources[0].message = message;
  }

  return {
    success: false,
    statusCode: status.BAD_REQUEST,
    message,
    errorSources,
  } as unknown as TErrorResponse;
};

export const handlePrismaClientValidationError = (
  err: Prisma.PrismaClientValidationError
): TErrorResponse => {
  return {
    success: false,
    statusCode: status.BAD_REQUEST,
    message: "Prisma validation error",
    errorSources: [{ path: "", message: err.message }],
  } as unknown as TErrorResponse;
};