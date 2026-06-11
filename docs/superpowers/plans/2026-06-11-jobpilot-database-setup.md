# JobPilot Database Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the MVP Prisma schema for Supabase Auth-backed profiles, job applications, and reminders, and document the concrete database bootstrap flow for the repository.

**Architecture:** Keep `auth.users` as the authentication source in Supabase and store app-level authorization in a `profiles` table keyed by the same user id. Add only the three MVP business models in Prisma, then document the environment variables, migration flow, and admin bootstrap needed to bring the database online.

**Tech Stack:** Next.js 16, TypeScript, Prisma 6, Supabase PostgreSQL

---

## File Structure

- Modify: `prisma/schema.prisma`
  - Replace the placeholder schema with the approved enums and MVP models.
- Modify: `.env.example`
  - Keep the environment template aligned with Supabase + Prisma usage.
- Modify: `README.md`
  - Replace the default template with database initialization steps relevant to this project.
- Reference: `docs/superpowers/specs/2026-06-11-jobpilot-database-design.md`
  - Source of truth for the approved design.

### Task 1: Implement Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Replace the placeholder Prisma schema with the approved MVP schema**

Use this full schema:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum AppRole {
  ADMIN
  USER
}

enum JobStatus {
  SAVED
  APPLIED
  INTERVIEWING
  OFFER
  REJECTED
  ARCHIVED
}

enum JobType {
  FULL_TIME
  PART_TIME
  INTERNSHIP
  CONTRACT
  FREELANCE
  REMOTE
  HYBRID
  ONSITE
}

enum JobSource {
  LINKEDIN
  TOPCV
  VIETNAMWORKS
  INDEED
  COMPANY_WEBSITE
  REFERRAL
  OTHER
}

enum ReminderType {
  FOLLOW_UP
  INTERVIEW
  DEADLINE
  CUSTOM
}

model Profile {
  id        String   @id
  email     String   @unique
  fullName  String?
  avatarUrl String?
  role      AppRole  @default(USER)
  isBlocked Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  jobs      JobApplication[]
  reminders Reminder[]

  @@map("profiles")
  @@index([role])
  @@index([isBlocked])
}

model JobApplication {
  id          String    @id @default(cuid())
  userId      String
  companyName String
  jobTitle    String
  jobUrl      String?
  location    String?
  salaryRange String?
  jobType     JobType?
  source      JobSource?
  status      JobStatus @default(SAVED)
  appliedDate DateTime?
  deadline    DateTime?
  description String?
  notes       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user      Profile    @relation(fields: [userId], references: [id], onDelete: Cascade)
  reminders Reminder[]

  @@map("job_applications")
  @@index([userId, createdAt])
  @@index([userId, status])
  @@index([userId, source])
  @@index([userId, jobType])
  @@index([companyName])
  @@index([jobTitle])
}

model Reminder {
  id               String       @id @default(cuid())
  userId           String
  jobApplicationId String?
  title            String
  reminderDate     DateTime
  type             ReminderType @default(CUSTOM)
  isCompleted      Boolean      @default(false)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  user           Profile         @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobApplication JobApplication? @relation(fields: [jobApplicationId], references: [id], onDelete: Cascade)

  @@map("reminders")
  @@index([userId, reminderDate])
  @@index([userId, isCompleted])
  @@index([jobApplicationId])
}
```

- [ ] **Step 2: Validate the Prisma schema**

Run: `npx prisma validate`
Expected: `The schema at prisma\schema.prisma is valid`

- [ ] **Step 3: Generate the Prisma client**

Run: `npx prisma generate`
Expected: Prisma client is generated under `src/generated/prisma`

### Task 2: Align Environment Template

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Update `.env.example` to include the expected database and Supabase values**

Use this content:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:6543/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

- [ ] **Step 2: Re-read `.env.example` and confirm the keys match the schema/bootstrap flow**

Expected keys:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Task 3: Replace README with Database Bootstrap Guide

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the default README with a project-specific setup guide**

Use this structure and content:

```md
# JobPilot

JobPilot is a job application tracker built with Next.js, Prisma, and Supabase PostgreSQL.

## Stack

- Next.js 16
- React 19
- TypeScript
- Prisma ORM
- Supabase Auth
- Supabase PostgreSQL

## Database Design

The current MVP database includes:

- `profiles`
- `job_applications`
- `reminders`

Authentication is handled by Supabase Auth. App-level authorization is stored in `profiles` using:

- `role`: `ADMIN | USER`
- `isBlocked`: soft block flag

## Environment Variables

Create `.env` from `.env.example` and fill in:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:6543/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Database Initialization

### 1. Create a Supabase project

- Create a new Supabase project
- Open project settings
- Copy the Postgres connection strings
- Copy the project URL and publishable key

### 2. Configure environment variables

- Put the pooled connection into `DATABASE_URL`
- Put the direct connection into `DIRECT_URL`
- Add your Supabase URL and publishable key
- Add `SUPABASE_SERVICE_ROLE_KEY` for privileged server-side flows

### 3. Validate and generate Prisma

```bash
npx prisma validate
npx prisma generate
```

### 4. Create the first migration

```bash
npx prisma migrate dev --name init_auth_profiles_jobs_reminders
```

### 5. Create the first admin user

Recommended flow:

1. Create the auth account with Supabase Auth
2. Insert the matching record into `profiles`
3. Set `role = ADMIN`
4. Keep `isBlocked = false`

The `profiles.id` value must match the Supabase Auth user id.

### 6. Profile creation strategy

This project uses app-side profile creation after signup.

Flow:

1. User signs up with Supabase Auth
2. App receives the auth user id
3. App inserts a row into `profiles`
4. Default values:
   - `role = USER`
   - `isBlocked = false`

### 7. Development commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
```
```

- [ ] **Step 2: Run project validation after the documentation and schema changes**

Run: `npm run lint`
Expected: lint passes without errors

Run: `npx tsc --noEmit`
Expected: type check passes without errors
