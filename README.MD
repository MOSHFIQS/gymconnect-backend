# 🏋️‍♂️ GymConnect — Backend REST API

> High-performance, modular REST API powering the **GymConnect** ecosystem. Built with **Node.js 20+ (ES Modules)**, **Express 5**, **TypeScript**, and **Prisma ORM 7** connected to a **PostgreSQL** database. Handles authentication, role-based access control, member profile lifecycle, manual payment verification, attendance check-ins, curated workout routines, and administrative management.

---

## 📑 Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Database Models (Prisma Schema)](#database-models-prisma-schema)
- [Role-Based Access Control](#role-based-access-control)
- [Complete API Endpoint Reference](#complete-api-endpoint-reference)
  - [1. Authentication Module (`/api/v1/auth`)](#1-authentication-module-apiv1auth)
  - [2. Members Module (`/api/v1/members`)](#2-members-module-apiv1members)
  - [3. Payments Module (`/api/v1/payments`)](#3-payments-module-apiv1payments)
  - [4. Attendance & Check-in Module (`/api/v1/attendance`)](#4-attendance--check-in-module-apiv1attendance)
  - [5. Workout Routines & Logs Module (`/api/v1/workouts`)](#5-workout-routines--logs-module-apiv1workouts)
  - [6. Notices & Announcements Module (`/api/v1/notices`)](#6-notices--announcements-module-apiv1notices)
  - [7. Admin Operations Module (`/api/v1/admin`)](#7-admin-operations-module-apiv1admin)
- [Automatic Database Seeding](#automatic-database-seeding)
- [Environment Variables](#environment-variables)
- [Local Setup & Deployment](#local-setup--deployment)

---

## 🏗️ Overview & Architecture

The GymConnect Backend API is structured cleanly around feature-driven modules with strict separation of concerns:

```text
gymconnect-backend/
├── prisma/
│   └── schema/schema.prisma     # Prisma Models, Enums & Relations
├── src/
│   ├── app/
│   │   ├── config/              # envVars, Cloudinary, Multer configurations
│   │   ├── errorHelpers/        # AppError, Prisma & Zod error handlers
│   │   ├── middleware/          # checkAuth, globalErrorHandler, notFound
│   │   ├── module/
│   │   │   ├── admin/           # Dashboard stats, user management, member approval
│   │   │   ├── attendance/      # Check-in logging, monthly streak, attendance stats
│   │   │   ├── auth/            # Signin, signup, getMe, password change
│   │   │   ├── member/          # Profile CRUD, Cloudinary upload, query builder
│   │   │   ├── notice/          # Gym announcements & notices CRUD
│   │   │   ├── payment/         # Gateway details, payment submission, admin verification
│   │   │   └── workout/         # Curated routines & workout completion logging
│   │   ├── routes/              # Central router mounting all modules
│   │   ├── shared/              # catchAsync, sendResponse helpers
│   │   └── utils/               # Admin seed, JWT generate/verify, cookie helpers
│   ├── app.ts                   # Express application setup, CORS, body parsers
│   ├── index.ts                 # Vercel serverless entry point
│   └── server.ts                # HTTP server listener & graceful shutdown handlers
├── vercel.json                  # Vercel serverless deployment config
└── package.json
```

---

## 🗄️ Database Models (Prisma Schema)

The database schema manages members, users, transactions, attendance, notices, and workout logs:

### 1. `User`
- `id` (UUID, Primary Key)
- `email` (Unique string)
- `password` (Bcrypt hashed)
- `role` (Enum: `ADMIN`, `MEMBER`)
- `isActive` (Boolean, default: `true`)
- Relations: One-to-One with `Member`, One-to-Many with `Payment`

### 2. `Member`
- `id` (UUID, Primary Key)
- `userId` (Unique foreign key to `User`)
- `fullName`, `email`, `phone`, `gender` (`MALE`, `FEMALE`, `OTHER`)
- `dateOfBirth`, `address`, `emergencyContact`
- `membershipPlan` (`MONTHLY`, `QUARTERLY`, `HALF_YEARLY`, `YEARLY`)
- `joiningDate` (DateTime)
- `profileImage` (Cloudinary URL string)
- `status` (Enum: `PENDING`, `ACTIVE`, `INACTIVE`)
- Relations: One-to-Many with `Payment`, `Attendance`, `WorkoutLog`

### 3. `Payment`
- `id` (UUID, Primary Key)
- `memberId` (Foreign key to `Member`)
- `userId` (Foreign key to `User`)
- `transactionId` (Unique string)
- `amount` (Float)
- `method` (Enum: `BKASH`, `NAGAD`, `BANK_TRANSFER`)
- `status` (Enum: `PENDING`, `APPROVED`, `REJECTED`)
- `adminNote` (Optional string)
- `verifiedAt` (DateTime)

### 4. `Notice`
- `id` (UUID, Primary Key)
- `title`, `content` (String)
- `category` (String: `GENERAL`, `OFFER`, `EVENT`, `MAINTENANCE`)
- `priority` (String: `NORMAL`, `HIGH`, `URGENT`)
- `isActive` (Boolean)

### 5. `Attendance`
- `id` (UUID, Primary Key)
- `memberId` (Foreign key to `Member`)
- `checkInDate` (DateTime, default: `now()`)
- `notes` (String)

### 6. `WorkoutLog`
- `id` (UUID, Primary Key)
- `memberId` (Foreign key to `Member`)
- `routineName`, `notes` (String)
- `completedAt` (DateTime, default: `now()`)

---

## 🔐 Role-Based Access Control

Endpoints are protected by the `checkAuth(...roles)` middleware, which decodes the JWT and validates user status:

| Role | Capabilities |
|---|---|
| **Public / Visitor** | Read landing details, view notices, view curated workout splits, calculate BMI |
| **MEMBER** | Create/view own profile, submit payments, check-in to gym, log workouts, view member VIP pass |
| **ADMIN** | Executive KPI dashboard, approve/reject payments, approve members, create/manage users, create notices, export data to CSV |

---

## 📡 Complete API Endpoint Reference

### 1. Authentication Module (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/signup` | Public | Register a new user (`email`, `password`) |
| `POST` | `/signin` | Public | Login with email and password (returns JWT & sets cookie) |
| `POST` | `/signout` | Authenticated | Clears auth token cookie |
| `GET` | `/me` | `MEMBER`, `ADMIN` | Get authenticated user profile with full member details |
| `PATCH` | `/change-password` | `MEMBER`, `ADMIN` | Update account password with old password verification |

### 2. Members Module (`/api/v1/members`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/` | `MEMBER`, `ADMIN` | Submit member registration form (supports multipart image upload) |
| `GET` | `/me` | `MEMBER`, `ADMIN` | Get logged-in user's member profile |
| `GET` | `/` | `ADMIN` | Get paginated members list with search, status, and plan filters |
| `GET` | `/:id` | `MEMBER`, `ADMIN` | Get member details by ID |
| `PATCH` | `/:id` | `MEMBER`, `ADMIN` | Update member details and profile image |
| `DELETE` | `/:id` | `ADMIN` | Delete member profile |

### 3. Payments Module (`/api/v1/payments`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/details` | Public | Get bKash, Nagad, and Bank transfer merchant account details |
| `GET` | `/my` | `MEMBER`, `ADMIN` | Get transaction history for logged-in member |
| `GET` | `/` | `ADMIN` | Get all payments with status/method filters |
| `GET` | `/:id` | `MEMBER`, `ADMIN` | Get single payment by ID |
| `POST` | `/` | `MEMBER`, `ADMIN` | Submit transaction payment (`memberId`, `amount`, `method`, `transactionId`) |
| `PATCH` | `/:id/verify` | `ADMIN` | Approve or reject payment (`status`, `adminNote`). Approving activates member! |

### 4. Attendance & Check-in Module (`/api/v1/attendance`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/check-in` | `MEMBER`, `ADMIN` | Log daily gym check-in (validates active status, prevents duplicate within 8h) |
| `GET` | `/my` | `MEMBER`, `ADMIN` | Get member's check-in history, total count, and monthly streak |
| `GET` | `/stats` | `ADMIN` | Get daily check-in volume and recent attendee list |

### 5. Workout Routines & Logs Module (`/api/v1/workouts`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/routines` | Public / Member | Get curated Push/Pull/Legs/HIIT workout splits with exercise guides |
| `POST` | `/log` | `MEMBER`, `ADMIN` | Log a completed workout routine session |
| `GET` | `/my-logs` | `MEMBER`, `ADMIN` | Get member's completed workout logs and history count |

### 6. Notices & Announcements Module (`/api/v1/notices`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public / Member | Get active gym notices (sorted by priority & date) |
| `POST` | `/` | `ADMIN` | Create a new notice (`title`, `content`, `category`, `priority`) |
| `PATCH` | `/:id` | `ADMIN` | Update notice content or toggle active status |
| `DELETE` | `/:id` | `ADMIN` | Remove notice |

### 7. Admin Operations Module (`/api/v1/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/dashboard` | `ADMIN` | Get KPI metrics: total members, active/pending counts, revenue totals |
| `GET` | `/users` | `ADMIN` | Get all registered users |
| `GET` | `/users/:id` | `ADMIN` | Get single user by ID |
| `POST` | `/users` | `ADMIN` | Create a new Admin user account |
| `PATCH` | `/users/:id/role` | `ADMIN` | Change user role between `MEMBER` and `ADMIN` |
| `PATCH` | `/users/:id/toggle-active` | `ADMIN` | Suspend or reactivate user login |
| `DELETE` | `/users/:id` | `ADMIN` | Delete user account |
| `PATCH` | `/members/:memberId/approve` | `ADMIN` | 1-Click activate member status |

---

## ⚡ Automatic Database Seeding

When the server starts (`pnpm dev` or `node dist/server.js`), the `seedAdmin()` utility checks if an Admin user exists matching `ADMIN_EMAIL`. If not, it automatically creates the root Admin account with hashed credentials:

- **Email**: Defined in `ADMIN_EMAIL` (default: `admin@gym.com`)
- **Password**: Defined in `ADMIN_PASSWORD` (default: `Admin@123`)
- **Role**: `ADMIN`

---

## ⚙️ Environment Variables

Create a `.env` file in the `gymconnect-backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Connection URL (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gym_management?schema=public"

# Frontend Client URL (CORS Allowed Origins)
FRONTEND_URL="http://localhost:3000"

# JWT Authentication
JWT_SECRET="gym_connect_super_secret_jwt_key_2025_secure_and_random"
JWT_EXPIRES_IN="7d"
BCRYPT_SALT_ROUNDS=12

# Admin Default Seed Credentials
ADMIN_EMAIL="admin@gym.com"
ADMIN_PASSWORD="Admin@123"

# Payment Details
BKASH_MERCHANT_NUMBER="01XXXXXXXXXX"
NAGAD_MERCHANT_NUMBER="01XXXXXXXXXX"
BANK_NAME="Dutch-Bangla Bank"
BANK_ACCOUNT="1234567890"
BANK_ROUTING="090261001"

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Email Configuration (SMTP)
EMAIL_SENDER_SMTP_HOST="smtp.gmail.com"
EMAIL_SENDER_SMTP_PORT="465"
EMAIL_SENDER_SMTP_USER="your_email@gmail.com"
EMAIL_SENDER_SMTP_PASS="your_email_app_password"
EMAIL_SENDER_SMTP_FROM="noreply@gym.com"
```

---

## 🚀 Local Setup & Deployment

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Generate Prisma Client & Sync Database
```bash
pnpm prisma generate
pnpm prisma db push
```

### 3. Run Development Server
```bash
pnpm dev
```
The server will start on [http://localhost:5000](http://localhost:5000) and automatically seed the initial admin account.

### 4. Build for Production
```bash
pnpm build
pnpm start
```
The build process compiles TypeScript with `tsup` into the `api` directory, ready for standard Node.js servers or Vercel serverless deployment via `vercel.json`.
