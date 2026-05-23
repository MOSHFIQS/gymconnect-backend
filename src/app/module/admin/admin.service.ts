import status from "http-status";
import AppError from "../../errorHelpers/AppError.js";
import bcrypt from "bcryptjs";
import { envVars } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { MemberStatus, Role } from "../../../generated/prisma/enums.js";

// ─── Dashboard ────────────────────────────────────────────────────────────────

const getDashboardStats = async () => {
     const [
          totalMembers,
          activeMembers,
          inactiveMembers,
          pendingMembers,
          pendingPayments,
          approvedPayments,
          rejectedPayments,
          recentRegistrations,
          revenueAgg,
          monthlyRevenue,
     ] = await prisma.$transaction([
          prisma.member.count(),
          prisma.member.count({ where: { status: MemberStatus.ACTIVE } }),
          prisma.member.count({ where: { status: MemberStatus.INACTIVE } }),
          prisma.member.count({ where: { status: MemberStatus.PENDING } }),
          prisma.payment.count({ where: { status: "PENDING" } }),
          prisma.payment.count({ where: { status: "APPROVED" } }),
          prisma.payment.count({ where: { status: "REJECTED" } }),
          prisma.member.findMany({
               orderBy: { createdAt: "desc" },
               take: 5,
               select: {
                    id: true,
                    fullName: true,
                    email: true,
                    membershipPlan: true,
                    status: true,
                    createdAt: true,
               },
          }),
          prisma.payment.aggregate({
               where: { status: "APPROVED" },
               _sum: { amount: true },
          }),
          // Revenue per month (last 6 months)
          prisma.payment.groupBy({
               by: ["createdAt"],
               where: {
                    status: "APPROVED",
                    createdAt: {
                         gte: new Date(
                              new Date().setMonth(new Date().getMonth() - 6)
                         ),
                    },
               },
               orderBy: {
                    createdAt: "asc",
               },
               _sum: {
                    amount: true,
               },
          }),
     ]);

     return {
          members: {
               total: totalMembers,
               active: activeMembers,
               inactive: inactiveMembers,
               pending: pendingMembers,
          },
          payments: {
               pending: pendingPayments,
               approved: approvedPayments,
               rejected: rejectedPayments,
          },
          revenue: {
               total: revenueAgg._sum.amount || 0,
               monthly: monthlyRevenue,
          },
          recentRegistrations,
     };
};

// ─── User Management ──────────────────────────────────────────────────────────

interface GetAllUsersOptions {
     page?: number;
     limit?: number;
     search?: string;
     role?: Role;
     isActive?: boolean;
}

const getAllUsers = async (options: GetAllUsersOptions) => {
     const { page = 1, limit = 10, search, role, isActive } = options;
     const skip = (page - 1) * limit;

     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     const where: any = {};
     if (search) {
          where.email = { contains: search, mode: "insensitive" };
     }
     if (role) where.role = role;
     if (isActive !== undefined) where.isActive = isActive;

     const [users, total] = await prisma.$transaction([
          prisma.user.findMany({
               where,
               skip,
               take: limit,
               orderBy: { createdAt: "desc" },
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
                              status: true,
                              membershipPlan: true,
                         },
                    },
               },
          }),
          prisma.user.count({ where }),
     ]);

     return {
          users,
          meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
     };
};

const getUserById = async (userId: string) => {
     const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
               id: true,
               email: true,
               role: true,
               isActive: true,
               createdAt: true,
               member: {
                    include: { payments: { orderBy: { createdAt: "desc" } } },
               },
          },
     });
     if (!user) throw new AppError(status.NOT_FOUND, "User not found");
     return user;
};

const changeUserRole = async (userId: string, newRole: Role) => {
     const user = await prisma.user.findUnique({ where: { id: userId } });
     if (!user) throw new AppError(status.NOT_FOUND, "User not found");

     return prisma.user.update({
          where: { id: userId },
          data: { role: newRole },
          select: { id: true, email: true, role: true },
     });
};

const toggleUserActive = async (userId: string) => {
     const user = await prisma.user.findUnique({ where: { id: userId } });
     if (!user) throw new AppError(status.NOT_FOUND, "User not found");

     const updated = await prisma.user.update({
          where: { id: userId },
          data: { isActive: !user.isActive },
          select: { id: true, email: true, isActive: true },
     });

     // Also update member status if they have a member profile
     if (updated) {
          const member = await prisma.member.findUnique({ where: { userId } });
          if (member) {
               await prisma.member.update({
                    where: { userId },
                    data: { status: updated.isActive ? MemberStatus.ACTIVE : MemberStatus.INACTIVE },
               });
          }
     }

     return updated;
};

const deleteUser = async (targetId: string, adminId: string) => {
     if (targetId === adminId) {
          throw new AppError(status.BAD_REQUEST, "You cannot delete your own account");
     }
     const user = await prisma.user.findUnique({ where: { id: targetId } });
     if (!user) throw new AppError(status.NOT_FOUND, "User not found");

     await prisma.user.delete({ where: { id: targetId } });
     return { message: "User deleted successfully" };
};

const approveMember = async (memberId: string) => {
     const member = await prisma.member.findUnique({ where: { id: memberId } });
     if (!member) throw new AppError(status.NOT_FOUND, "Member not found");

     return prisma.member.update({
          where: { id: memberId },
          data: { status: MemberStatus.ACTIVE },
     });
};

const createAdminUser = async (email: string, password: string) => {
     const existing = await prisma.user.findUnique({ where: { email } });
     if (existing) throw new AppError(status.CONFLICT, "Email already in use");

     const hashed = await bcrypt.hash(password, envVars.BCRYPT_SALT_ROUNDS);
     return prisma.user.create({
          data: { email, password: hashed, role: Role.ADMIN },
          select: { id: true, email: true, role: true, createdAt: true },
     });
};

export const AdminService = {
     getDashboardStats,
     getAllUsers,
     getUserById,
     changeUserRole,
     toggleUserActive,
     deleteUser,
     approveMember,
     createAdminUser,
};