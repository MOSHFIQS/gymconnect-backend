import bcrypt from "bcryptjs";
import status from "http-status";
import AppError from "../../errorHelpers/AppError.js";
import { generateToken } from "../../utils/jwt.js";
import { envVars } from "../../config/env.js";
import { SignupInput, SigninInput } from "./auth.validation.js";
import { prisma } from "../../lib/prisma.js";
import { Role } from "../../../generated/prisma/enums.js";

const signup = async (data: SignupInput) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError(status.CONFLICT, "Email already in use");
  }

  const hashedPassword = await bcrypt.hash(data.password, envVars.BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: Role.MEMBER,
    },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return { user, token };
};

const signin = async (data: SigninInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new AppError(status.FORBIDDEN, "Your account has been deactivated");
  }

  const passwordMatch = await bcrypt.compare(data.password, user.password);
  if (!passwordMatch) {
    throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return {
    user: { id: user.id, email: user.email, role: user.role },
    token,
  };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      member: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          gender: true,
          dateOfBirth: true,
          address: true,
          membershipPlan: true,
          joiningDate: true,
          emergencyContact: true,
          status: true,
          profileImage: true,
        },
      },
    },
  });

  if (!user) throw new AppError(status.NOT_FOUND, "User not found");
  return user;
};

const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(status.NOT_FOUND, "User not found");

  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) throw new AppError(status.UNAUTHORIZED, "Old password is incorrect");

  const hashed = await bcrypt.hash(newPassword, envVars.BCRYPT_SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  return { message: "Password changed successfully" };
};

export const AuthService = { signup, signin, getMe, changePassword };