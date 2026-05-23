import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import status from "http-status";
import AppError from "../errorHelpers/AppError.js";
import { envVars } from "../config/env.js";
import { Role } from "../../generated/prisma/enums.js";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}

export const checkAuth = (...roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.token ||
        req.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        throw new AppError(status.UNAUTHORIZED, "Unauthorized: No token provided");
      }

      const decoded = jwt.verify(token, envVars.JWT_SECRET) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (!user) {
        throw new AppError(status.UNAUTHORIZED, "Unauthorized: User not found");
      }

      if (!user.isActive) {
        throw new AppError(status.FORBIDDEN, "Your account is deactivated");
      }

      if (roles.length && !roles.includes(user.role)) {
        throw new AppError(
          status.FORBIDDEN,
          "Forbidden: You do not have permission"
        );
      }

      req.user = { id: user.id, email: user.email, role: user.role };
      next();
    } catch (error) {
      next(error);
    }
  };
};