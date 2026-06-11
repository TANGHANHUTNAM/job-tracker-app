"use server";

import { type Prisma, type ReminderType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentAccount } from "@/lib/auth/session";
import type { ReminderActionInput } from "./types";

type ActionResult = {
  success: boolean;
  message: string;
};

type JobScopeOk = { ok: true; id: string };
type JobScopeError = { ok: false; error: string };
type JobScopeResult = JobScopeOk | JobScopeError | null;

function isReminderType(value: string): value is ReminderType {
  return value === "FOLLOW_UP" || value === "INTERVIEW" || value === "DEADLINE" || value === "CUSTOM";
}

async function resolveJobScope(jobApplicationId: string, userId: string, isAdmin: boolean): Promise<JobScopeResult> {
  if (!jobApplicationId) {
    return null;
  }

  const where: Prisma.JobApplicationWhereUniqueInput = { id: jobApplicationId };
  const job = await prisma.jobApplication.findUnique({
    where,
    select: { id: true, userId: true },
  });

  if (!job) {
    return { ok: false, error: "Không tìm thấy việc làm được liên kết." };
  }

  if (!isAdmin && job.userId !== userId) {
    return { ok: false, error: "Bạn không có quyền gắn reminder vào việc làm này." };
  }

  return { ok: true, id: job.id };
}

async function createReminder(input: ReminderActionInput): Promise<ActionResult> {
  const { profile } = await requireCurrentAccount();
  const isAdmin = profile.role === "ADMIN";

  const title = input.title.trim();
  const reminderDate = input.reminderDate.trim();
  const jobApplicationId = input.jobApplicationId.trim();

  if (!title || !reminderDate || !isReminderType(input.type)) {
    return { success: false, message: "Vui lòng nhập đầy đủ thông tin bắt buộc." };
  }

  const jobScope = await resolveJobScope(jobApplicationId, profile.id, isAdmin);
  if (jobScope && !jobScope.ok) {
    return { success: false, message: jobScope.error };
  }

  await prisma.reminder.create({
    data: {
      userId: profile.id,
      title,
      reminderDate: new Date(`${reminderDate}T09:00:00`),
      type: input.type,
      jobApplicationId: jobScope?.ok ? jobScope.id : null,
    },
  });

  revalidatePath("/dashboard/reminders");
  revalidatePath("/dashboard");
  return { success: true, message: "Tạo nhắc nhở thành công." };
}

async function updateReminder(input: ReminderActionInput): Promise<ActionResult> {
  const { profile } = await requireCurrentAccount();
  const isAdmin = profile.role === "ADMIN";

  const id = input.id?.trim() ?? "";
  const title = input.title.trim();
  const reminderDate = input.reminderDate.trim();
  const jobApplicationId = input.jobApplicationId.trim();

  if (!id || !title || !reminderDate || !isReminderType(input.type)) {
    return { success: false, message: "Vui lòng nhập đầy đủ thông tin hợp lệ." };
  }

  const reminder = await prisma.reminder.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!reminder || (!isAdmin && reminder.userId !== profile.id)) {
    return { success: false, message: "Không tìm thấy nhắc nhở cần cập nhật." };
  }

  const jobScope = await resolveJobScope(jobApplicationId, profile.id, isAdmin);
  if (jobScope && !jobScope.ok) {
    return { success: false, message: jobScope.error };
  }

  await prisma.reminder.update({
    where: { id },
    data: {
      title,
      reminderDate: new Date(`${reminderDate}T09:00:00`),
      type: input.type,
      jobApplicationId: jobScope?.ok ? jobScope.id : null,
    },
  });

  revalidatePath("/dashboard/reminders");
  revalidatePath("/dashboard");
  return { success: true, message: "Cập nhật nhắc nhở thành công." };
}

async function deleteReminder(id: string): Promise<ActionResult> {
  const { profile } = await requireCurrentAccount();
  const isAdmin = profile.role === "ADMIN";
  const reminderId = id.trim();

  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
    select: { id: true, userId: true },
  });

  if (!reminder || (!isAdmin && reminder.userId !== profile.id)) {
    return { success: false, message: "Không tìm thấy nhắc nhở cần xóa." };
  }

  await prisma.reminder.delete({ where: { id: reminderId } });

  revalidatePath("/dashboard/reminders");
  revalidatePath("/dashboard");
  return { success: true, message: "Đã xóa nhắc nhở." };
}

async function toggleReminderCompletion(id: string): Promise<ActionResult> {
  const { profile } = await requireCurrentAccount();
  const isAdmin = profile.role === "ADMIN";
  const reminderId = id.trim();

  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
    select: { id: true, userId: true, isCompleted: true },
  });

  if (!reminder || (!isAdmin && reminder.userId !== profile.id)) {
    return { success: false, message: "Không tìm thấy nhắc nhở cần cập nhật." };
  }

  await prisma.reminder.update({
    where: { id: reminderId },
    data: { isCompleted: !reminder.isCompleted },
  });

  revalidatePath("/dashboard/reminders");
  revalidatePath("/dashboard");
  return {
    success: true,
    message: reminder.isCompleted ? "Đã mở lại nhắc nhở." : "Đã đánh dấu hoàn thành nhắc nhở.",
  };
}

export { createReminder, updateReminder, deleteReminder, toggleReminderCompletion };
