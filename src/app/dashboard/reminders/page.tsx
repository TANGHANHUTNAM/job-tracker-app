import { type ReminderType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentAccount } from "@/lib/auth/session";
import { RemindersManager } from "./reminders-manager";
import type { ReminderStatusFilter } from "./types";

const PAGE_SIZE = 10;

function isReminderType(value?: string): value is ReminderType {
  return value === "FOLLOW_UP" || value === "INTERVIEW" || value === "DEADLINE" || value === "CUSTOM";
}

function isReminderStatus(value?: string): value is Exclude<ReminderStatusFilter, ""> {
  return value === "open" || value === "completed";
}

export default async function RemindersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile } = await requireCurrentAccount();
  const isAdmin = profile.role === "ADMIN";
  const params = (await searchParams) ?? {};

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status: ReminderStatusFilter = typeof params.status === "string" && isReminderStatus(params.status) ? params.status : "";
  const type = typeof params.type === "string" && isReminderType(params.type) ? params.type : "";
  const sort = typeof params.sort === "string" && params.sort === "desc" ? "desc" : "asc";
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);

  const where: Prisma.ReminderWhereInput = {
    ...(isAdmin ? {} : { userId: profile.id }),
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    ...(status ? { isCompleted: status === "completed" } : {}),
    ...(type ? { type } : {}),
  };

  const [totalCount, reminders, jobs] = await Promise.all([
    prisma.reminder.count({ where }),
    prisma.reminder.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
        jobApplication: {
          select: { id: true, companyName: true, jobTitle: true },
        },
      },
      orderBy: { reminderDate: sort },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.jobApplication.findMany({
      where: isAdmin ? {} : { userId: profile.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        companyName: true,
        jobTitle: true,
        user: {
          select: { email: true },
        },
      },
      take: 200,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const jobOptions = jobs.map((job) => ({
    id: job.id,
    label: `${job.companyName} - ${job.jobTitle}${isAdmin ? ` · ${job.user.email}` : ""}`,
  }));

  return (
    <RemindersManager
      reminders={reminders.map((reminder) => ({
        id: reminder.id,
        title: reminder.title,
        reminderDate: reminder.reminderDate,
        type: reminder.type,
        isCompleted: reminder.isCompleted,
        jobApplicationId: reminder.jobApplicationId,
        jobLabel: reminder.jobApplication
          ? `${reminder.jobApplication.companyName} - ${reminder.jobApplication.jobTitle}`
          : null,
        ownerLabel: reminder.user.fullName || reminder.user.email,
      }))}
      jobs={jobOptions}
      filters={{ q, status, type, sort }}
      isAdmin={isAdmin}
      pagination={{ page, pageSize: PAGE_SIZE, totalCount, totalPages }}
    />
  );
}
