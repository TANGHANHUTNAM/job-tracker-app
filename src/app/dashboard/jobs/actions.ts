"use server";

import { type JobStatus, type Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireCurrentAccount } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { JobActionInput, JobActionResult } from "./types";

function toNullableString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toNullableDate(value?: string) {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseJobInput(input: JobActionInput) {
  const companyName = input.companyName.trim();
  const jobTitle = input.jobTitle.trim();

  if (!companyName) {
    return { data: null, error: "Vui lòng nhập tên công ty." };
  }

  if (!jobTitle) {
    return { data: null, error: "Vui lòng nhập vị trí ứng tuyển." };
  }

  const appliedDate = toNullableDate(input.appliedDate);
  const deadline = toNullableDate(input.deadline);

  if (input.appliedDate?.trim() && !appliedDate) {
    return { data: null, error: "Ngày ứng tuyển không hợp lệ." };
  }

  if (input.deadline?.trim() && !deadline) {
    return { data: null, error: "Hạn chót không hợp lệ." };
  }

  return {
    data: {
      companyName,
      jobTitle,
      jobUrl: toNullableString(input.jobUrl),
      location: toNullableString(input.location),
      salaryRange: toNullableString(input.salaryRange),
      jobType: input.jobType || null,
      sourceId: toNullableString(input.sourceId),
      status: input.status,
      appliedDate,
      deadline,
      description: toNullableString(input.description),
      notes: toNullableString(input.notes),
    },
    error: null,
  };
}

async function getAuthorizedJob(id: string) {
  const { profile } = await requireCurrentAccount();

  const job = await prisma.jobApplication.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!job) {
    return { profile, job: null, error: "Không tìm thấy việc làm." };
  }

  if (profile.role !== "ADMIN" && job.userId !== profile.id) {
    return { profile, job: null, error: "Bạn không có quyền thao tác với việc làm này." };
  }

  return { profile, job, error: null };
}

function getPrismaErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError;

    if (prismaError.code === "P2003") {
      return "Nguồn việc làm được chọn không hợp lệ.";
    }
  }

  return fallback;
}

async function createJob(input: JobActionInput): Promise<JobActionResult> {
  const { profile } = await requireCurrentAccount();
  const parsed = parseJobInput(input);

  if (parsed.error || !parsed.data) {
    return { success: false, message: parsed.error ?? "Dữ liệu việc làm không hợp lệ." };
  }

  try {
    await prisma.jobApplication.create({
      data: {
        userId: profile.id,
        ...parsed.data,
      },
    });

    revalidatePath("/dashboard/jobs");
    revalidatePath("/dashboard");

    return { success: true, message: "Tạo việc làm thành công." };
  } catch (error) {
    return {
      success: false,
      message: getPrismaErrorMessage(error, "Không thể tạo việc làm."),
    };
  }
}

async function updateJob(input: JobActionInput): Promise<JobActionResult> {
  if (!input.id) {
    return { success: false, message: "Thiếu mã việc làm cần cập nhật." };
  }

  const authorized = await getAuthorizedJob(input.id);
  if (authorized.error) {
    return { success: false, message: authorized.error };
  }

  const parsed = parseJobInput(input);
  if (parsed.error || !parsed.data) {
    return { success: false, message: parsed.error ?? "Dữ liệu việc làm không hợp lệ." };
  }

  try {
    await prisma.jobApplication.update({
      where: { id: input.id },
      data: parsed.data,
    });

    revalidatePath("/dashboard/jobs");
    revalidatePath("/dashboard");

    return { success: true, message: "Cập nhật việc làm thành công." };
  } catch (error) {
    return {
      success: false,
      message: getPrismaErrorMessage(error, "Không thể cập nhật việc làm."),
    };
  }
}

async function deleteJob(id: string): Promise<JobActionResult> {
  if (!id) {
    return { success: false, message: "Thiếu mã việc làm cần xóa." };
  }

  const authorized = await getAuthorizedJob(id);
  if (authorized.error) {
    return { success: false, message: authorized.error };
  }

  try {
    await prisma.jobApplication.delete({ where: { id } });

    revalidatePath("/dashboard/jobs");
    revalidatePath("/dashboard");

    return { success: true, message: "Xóa việc làm thành công." };
  } catch {
    return { success: false, message: "Không thể xóa việc làm." };
  }
}

async function updateJobStatus(id: string, status: JobStatus): Promise<JobActionResult> {
  if (!id) {
    return { success: false, message: "Thiếu mã việc làm cần cập nhật trạng thái." };
  }

  const authorized = await getAuthorizedJob(id);
  if (authorized.error) {
    return { success: false, message: authorized.error };
  }

  try {
    await prisma.jobApplication.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/dashboard/jobs");
    revalidatePath("/dashboard");

    return { success: true, message: "Cập nhật trạng thái việc làm thành công." };
  } catch {
    return { success: false, message: "Không thể cập nhật trạng thái việc làm." };
  }
}

export { createJob, updateJob, deleteJob, updateJobStatus };
