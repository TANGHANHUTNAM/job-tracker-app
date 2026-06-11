"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { JobSourceActionInput, JobSourceActionResult } from "./types";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseInput(input: JobSourceActionInput) {
  const name = input.name.trim();
  const slug = slugify(input.slug?.trim() || name);
  const description = input.description?.trim() || null;

  if (!name) {
    return {
      data: null,
      error: "Vui lòng nhập tên nguồn việc làm.",
    };
  }

  if (!slug) {
    return {
      data: null,
      error: "Slug không hợp lệ. Vui lòng kiểm tra lại tên nguồn.",
    };
  }

  if (!Number.isFinite(input.sortOrder)) {
    return {
      data: null,
      error: "Thứ tự hiển thị không hợp lệ.",
    };
  }

  return {
    data: {
      name,
      slug,
      description,
        sortOrder: Math.max(0, Math.trunc(input.sortOrder)),
        isActive: input.isActive,
      },
    error: null,
  };
}

function getPrismaErrorMessage(error: unknown, fallback: string) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "Tên hoặc slug của nguồn việc làm đã tồn tại.";
  }

  return fallback;
}

async function createJobSource(
  input: JobSourceActionInput
): Promise<JobSourceActionResult> {
  await requireRole("ADMIN");

  const parsed = parseInput(input);
  if (parsed.error) {
    return { success: false, message: parsed.error };
  }

  const sourceData = parsed.data;

  if (!sourceData) {
    return { success: false, message: "Dữ liệu nguồn việc làm không hợp lệ." };
  }

  try {
    await prisma.jobSource.create({
      data: sourceData,
    });

    revalidatePath("/dashboard/job-sources");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Tạo nguồn việc làm thành công.",
    };
  } catch (error) {
    return {
      success: false,
      message: getPrismaErrorMessage(error, "Không thể tạo nguồn việc làm."),
    };
  }
}

async function updateJobSource(
  input: JobSourceActionInput
): Promise<JobSourceActionResult> {
  await requireRole("ADMIN");

  if (!input.id) {
    return { success: false, message: "Thiếu mã nguồn việc làm cần cập nhật." };
  }

  const parsed = parseInput(input);
  if (parsed.error) {
    return { success: false, message: parsed.error };
  }

  const sourceData = parsed.data;

  if (!sourceData) {
    return { success: false, message: "Dữ liệu nguồn việc làm không hợp lệ." };
  }

  try {
    await prisma.jobSource.update({
      where: { id: input.id },
      data: sourceData,
    });

    revalidatePath("/dashboard/job-sources");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Cập nhật nguồn việc làm thành công.",
    };
  } catch (error) {
    return {
      success: false,
      message: getPrismaErrorMessage(error, "Không thể cập nhật nguồn việc làm."),
    };
  }
}

async function deleteJobSource(id: string): Promise<JobSourceActionResult> {
  await requireRole("ADMIN");

  if (!id) {
    return { success: false, message: "Thiếu mã nguồn việc làm cần xóa." };
  }

  try {
    await prisma.jobSource.delete({
      where: { id },
    });

    revalidatePath("/dashboard/job-sources");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Xóa nguồn việc làm thành công.",
    };
  } catch {
    return {
      success: false,
      message:
        "Không thể xóa nguồn việc làm. Hãy kiểm tra xem nguồn này có đang được dùng trong dữ liệu khác hay không.",
    };
  }
}

export { createJobSource, updateJobSource, deleteJobSource };
