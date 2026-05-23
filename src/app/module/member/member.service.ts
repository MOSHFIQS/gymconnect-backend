import status from "http-status";
import AppError from "../../errorHelpers/AppError.js";
import { CreateMemberInput, UpdateMemberInput } from "./member.validation.js";
import { MemberStatus, Role } from "../../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";


const createMember = async (
  userId: string,
  email: string,
  data: CreateMemberInput,
  profileImage?: string
) => {
  const existing = await prisma.member.findUnique({ where: { userId } });
  if (existing) {
    throw new AppError(status.CONFLICT, "Member registration already exists for this account");
  }

  const emailExists = await prisma.member.findUnique({ where: { email } });
  if (emailExists) {
    throw new AppError(status.CONFLICT, "Email already registered as member");
  }

  const member = await prisma.member.create({
    data: {
      userId,
      email,
      fullName: data.fullName,
      phone: data.phone,
      gender: data.gender,
      dateOfBirth: new Date(data.dateOfBirth),
      address: data.address,
      membershipPlan: data.membershipPlan,
      joiningDate: new Date(data.joiningDate),
      emergencyContact: data.emergencyContact,
      profileImage: profileImage || null,
      status: MemberStatus.PENDING,
    },
  });

  return member;
};

const updateMember = async (
  userId: string,
  memberId: string,
  role: Role,
  data: UpdateMemberInput,
  profileImage?: string
) => {
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) throw new AppError(status.NOT_FOUND, "Member not found");

  // Only admin or owner can update
  if (role !== Role.ADMIN && member.userId !== userId) {
    throw new AppError(status.FORBIDDEN, "Forbidden");
  }

  const updated = await prisma.member.update({
    where: { id: memberId },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
      profileImage: profileImage || undefined,
    },
  });

  return updated;
};

const deleteMember = async (userId: string, memberId: string, role: Role) => {
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) throw new AppError(status.NOT_FOUND, "Member not found");

  if (role !== Role.ADMIN && member.userId !== userId) {
    throw new AppError(status.FORBIDDEN, "Forbidden");
  }

  await prisma.member.delete({ where: { id: memberId } });
  return { message: "Member deleted successfully" };
};

const getMemberById = async (memberId: string) => {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      user: { select: { email: true, role: true, isActive: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!member) throw new AppError(status.NOT_FOUND, "Member not found");
  return member;
};

const getMyMemberProfile = async (userId: string) => {
  const member = await prisma.member.findUnique({
    where: { userId },
    include: {
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!member) throw new AppError(status.NOT_FOUND, "Member profile not found");
  return member;
};

interface GetAllMembersOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: MemberStatus;
  membershipPlan?: string;
  gender?: string;
}

const getAllMembers = async (options: GetAllMembersOptions) => {
  const {
    page = 1,
    limit = 10,
    search,
    status: memberStatus,
    membershipPlan,
    gender,
  } = options;

  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  if (memberStatus) where.status = memberStatus;
  if (membershipPlan) where.membershipPlan = membershipPlan;
  if (gender) where.gender = gender;

  const [members, total] = await prisma.$transaction([
    prisma.member.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, isActive: true } },
        payments: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.member.count({ where }),
  ]);

  return {
    members,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const MemberService = {
  createMember,
  updateMember,
  deleteMember,
  getMemberById,
  getMyMemberProfile,
  getAllMembers,
};