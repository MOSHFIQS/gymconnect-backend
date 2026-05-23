import jwt from "jsonwebtoken";
import { envVars } from "../config/env.js";

export const generateToken = (payload: {
  id: string;
  email: string;
  role: string;
}): string => {
  return jwt.sign(payload, envVars.JWT_SECRET, {
    expiresIn: envVars.JWT_EXPIRES_IN as string,
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, envVars.JWT_SECRET);
};