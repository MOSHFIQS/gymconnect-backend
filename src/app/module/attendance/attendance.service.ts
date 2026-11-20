import status from "http-status";
import AppError from "../../errorHelpers/AppError.js";
import { prisma } from "../../lib/prisma.js";
import { MemberStatus } from "../../../generated/prisma/enums.js";

const checkIn = async (userId: string, notes?: string) => {
  const member = await prisma.member.findUnique({
    where: { userId },
  });

  if (!member) {
    throw new AppError(status.NOT_FOUND, "Member profile not found. Please register first.");
  }

  if (member.status !== MemberStatus.ACTIVE) {
    throw new AppError(
      status.FORBIDDEN,
      `Your membership is currently ${member.status}. Only ACTIVE verified members can check in.`
    );
  }

  // Check if checked in within the last 8 hours
  const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
  const recentCheckIn = await prisma.attendance.findFirst({
    where: {
      memberId: member.id,
      checkInDate: { gte: eightHoursAgo },
    },
  });

  if (recentCheckIn) {
    return {
      alreadyCheckedIn: true,
      attendance: recentCheckIn,
      message: "You have already checked in today! Have a great workout session.",
    };
  }

  const newAttendance = await prisma.attendance.create({
    data: {
      memberId: member.id,
      notes: notes || "Daily workout gym floor session",
    },
  });

  // Calculate streak this month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthCount = await prisma.attendance.count({
    where: {
      memberId: member.id,
      checkInDate: { gte: startOfMonth },
    },
  });

  return {
    alreadyCheckedIn: false,
    attendance: newAttendance,
    monthlyStreak: monthCount,
    message: "Gym check-in successful! Welcome to GymConnect.",
  };
};

const getMyAttendance = async (userId: string) => {
  const member = await prisma.member.findUnique({
    where: { userId },
  });

  if (!member) {
    return {
      attendances: [],
      totalCount: 0,
      thisMonthCount: 0,
      lastCheckIn: null,
    };
  }

  const attendances = await prisma.attendance.findMany({
    where: { memberId: member.id },
    orderBy: { checkInDate: "desc" },
    take: 30,
  });

  const totalCount = await prisma.attendance.count({
    where: { memberId: member.id },
  });

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const thisMonthCount = await prisma.attendance.count({
    where: {
      memberId: member.id,
      checkInDate: { gte: startOfMonth },
    },
  });

  return {
    attendances,
    totalCount,
    thisMonthCount,
    lastCheckIn: attendances[0]?.checkInDate || null,
  };
};

const getAttendanceStats = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayCount = await prisma.attendance.count({
    where: { checkInDate: { gte: startOfToday } },
  });

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthCount = await prisma.attendance.count({
    where: { checkInDate: { gte: startOfMonth } },
  });

  const recentCheckIns = await prisma.attendance.findMany({
    orderBy: { checkInDate: "desc" },
    take: 15,
    include: {
      member: {
        select: {
          fullName: true,
          email: true,
          membershipPlan: true,
          profileImage: true,
        },
      },
    },
  });

  return {
    todayCount,
    monthCount,
    recentCheckIns,
  };
};

export const AttendanceService = {
  checkIn,
  getMyAttendance,
  getAttendanceStats,
};
