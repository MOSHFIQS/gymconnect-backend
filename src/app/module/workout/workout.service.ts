import status from "http-status";
import AppError from "../../errorHelpers/AppError.js";
import { prisma } from "../../lib/prisma.js";

const CURATED_ROUTINES = [
  {
    id: "push-day",
    name: "Push Day (Chest, Shoulders & Triceps)",
    focus: "Hypertrophy & Upper Body Power",
    days: "Monday / Thursday",
    level: "Intermediate",
    color: "from-orange-500/20 to-red-500/10",
    exercises: [
      { name: "Barbell Flat Bench Press", sets: "4 Sets", reps: "8-10 Reps", rest: "90s", tip: "Arch upper back, retract scapula" },
      { name: "Incline Dumbbell Press", sets: "3 Sets", reps: "10-12 Reps", rest: "75s", tip: "Set bench to 30 degrees for upper pec activation" },
      { name: "Seated Dumbbell Shoulder Press", sets: "3 Sets", reps: "8-10 Reps", rest: "90s", tip: "Press overhead without locking elbows harshly" },
      { name: "Cable Lateral Raises", sets: "4 Sets", reps: "12-15 Reps", rest: "60s", tip: "Lead with elbows for full medial delt pump" },
      { name: "Tricep Rope Cable Pushdowns", sets: "3 Sets", reps: "12-15 Reps", rest: "60s", tip: "Flare rope outward at the bottom contraction" },
    ],
  },
  {
    id: "pull-day",
    name: "Pull Day (Back, Biceps & Rear Delts)",
    focus: "V-Taper & Core Pulling Strength",
    days: "Tuesday / Friday",
    level: "Intermediate",
    color: "from-blue-500/20 to-indigo-500/10",
    exercises: [
      { name: "Conventional / Romanian Deadlifts", sets: "4 Sets", reps: "6-8 Reps", rest: "120s", tip: "Brace core tight, hinge at hips" },
      { name: "Wide-Grip Lat Pulldowns", sets: "4 Sets", reps: "10-12 Reps", rest: "75s", tip: "Pull bar down to clavicle, squeeze lats" },
      { name: "Seated Cable Rows (Close Grip)", sets: "3 Sets", reps: "10-12 Reps", rest: "60s", tip: "Keep torso upright, drive elbows back" },
      { name: "Face Pulls with External Rotation", sets: "3 Sets", reps: "15 Reps", rest: "60s", tip: "Essential for rear delts and rotator cuff health" },
      { name: "Dumbbell Incline Bicep Curls", sets: "3 Sets", reps: "10-12 Reps", rest: "60s", tip: "Full stretch on long head of the bicep" },
    ],
  },
  {
    id: "legs-day",
    name: "Legs & Core Day (Quads, Hamstrings & Calves)",
    focus: "Lower Body Force & Trunk Stability",
    days: "Wednesday / Saturday",
    level: "Advanced",
    color: "from-emerald-500/20 to-teal-500/10",
    exercises: [
      { name: "Barbell Back Squats", sets: "4 Sets", reps: "8-10 Reps", rest: "120s", tip: "Break at hips and knees simultaneously, hit parallel" },
      { name: "45-Degree Leg Press", sets: "3 Sets", reps: "10-12 Reps", rest: "90s", tip: "Keep feet shoulder-width, never lock knees" },
      { name: "Lying Leg Hamstring Curls", sets: "3 Sets", reps: "12-15 Reps", rest: "60s", tip: "Slow 3-second negative descent" },
      { name: "Dumbbell Walking Lunges", sets: "3 Sets", reps: "12 Reps / leg", rest: "75s", tip: "Keep torso upright, 90 degree knee angles" },
      { name: "Hanging Leg Raises / Plank", sets: "3 Sets", reps: "15 Reps / 60s", rest: "45s", tip: "Engage lower abdominals without swinging" },
    ],
  },
  {
    id: "hiit-shred",
    name: "HIIT & Cardio Conditioning Shred",
    focus: "Fat Loss, VO2 Max & Stamina",
    days: "Flexible / 2-3x weekly",
    level: "All Levels",
    color: "from-rose-500/20 to-amber-500/10",
    exercises: [
      { name: "Curved Runner / Treadmill Sprints", sets: "6 Rounds", reps: "30s sprint / 45s walk", rest: "45s", tip: "Max effort explosive acceleration" },
      { name: "Kettlebell Russian Swings", sets: "4 Sets", reps: "20 Reps", rest: "45s", tip: "Power from glutes and hips, not arms" },
      { name: "Heavy Battle Ropes Slams", sets: "4 Sets", reps: "30s active", rest: "30s", tip: "Athletic half-squat stance, intense rhythm" },
      { name: "Plyometric Box Jumps", sets: "3 Sets", reps: "12 Reps", rest: "60s", tip: "Land softly with knees slightly bent" },
    ],
  },
];

const getCuratedRoutines = () => {
  return CURATED_ROUTINES;
};

const logWorkout = async (userId: string, routineName: string, notes?: string) => {
  const member = await prisma.member.findUnique({
    where: { userId },
  });

  if (!member) {
    throw new AppError(status.NOT_FOUND, "Member profile required to log workouts");
  }

  const log = await prisma.workoutLog.create({
    data: {
      memberId: member.id,
      routineName,
      notes: notes || "Completed scheduled workout split",
    },
  });

  const totalLogs = await prisma.workoutLog.count({
    where: { memberId: member.id },
  });

  return {
    log,
    totalLogs,
    message: `Awesome work! "${routineName}" session logged successfully.`,
  };
};

const getMyLogs = async (userId: string) => {
  const member = await prisma.member.findUnique({
    where: { userId },
  });

  if (!member) {
    return { logs: [], totalCount: 0 };
  }

  const logs = await prisma.workoutLog.findMany({
    where: { memberId: member.id },
    orderBy: { completedAt: "desc" },
    take: 30,
  });

  const totalCount = await prisma.workoutLog.count({
    where: { memberId: member.id },
  });

  return { logs, totalCount };
};

export const WorkoutService = {
  getCuratedRoutines,
  logWorkout,
  getMyLogs,
};
