"use server";

import { type AppRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CreateUserInput,
  ToggleUserStatusInput,
  UpdateUserInput,
} from "./types";

type ActionResult = {
  success: boolean;
  message: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeName(fullName: string) {
  return fullName.trim();
}

function isAppRole(value: string): value is AppRole {
  return value === "ADMIN" || value === "USER";
}

async function createUser(input: CreateUserInput): Promise<ActionResult> {
  await requireRole("ADMIN");

  const fullName = normalizeName(input.fullName);
  const email = normalizeEmail(input.email);
  const password = input.password;
  const role = input.role;

  if (!fullName || !email || !password || !isAppRole(role)) {
    return { success: false, message: "Vui lòng nhập đầy đủ thông tin bắt buộc." };
  }

  if (password.length < 6) {
    return { success: false, message: "Mật khẩu phải có ít nhất 6 ký tự." };
  }

  const existingProfile = await prisma.profile.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingProfile) {
    return { success: false, message: "Email này đã tồn tại." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: fullName,
    },
  });

  if (error || !data.user) {
    return {
      success: false,
      message: error?.message ?? "Không thể tạo tài khoản người dùng mới.",
    };
  }

  await prisma.profile.upsert({
    where: { id: data.user.id },
    update: {
      email,
      fullName,
      role,
      isBlocked: false,
    },
    create: {
      id: data.user.id,
      email,
      fullName,
      role,
      isBlocked: false,
    },
  });

  revalidatePath("/dashboard/users");
  return { success: true, message: "Tạo người dùng mới thành công." };
}

async function updateUser(input: UpdateUserInput): Promise<ActionResult> {
  await requireRole("ADMIN");

  const id = input.id.trim();
  const fullName = normalizeName(input.fullName);
  const role = input.role;

  if (!id || !fullName || !isAppRole(role)) {
    return { success: false, message: "Vui lòng nhập đầy đủ thông tin hợp lệ." };
  }

  const profile = await prisma.profile.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!profile) {
    return { success: false, message: "Không tìm thấy người dùng cần cập nhật." };
  }

  await prisma.profile.update({
    where: { id },
    data: {
      fullName,
      role,
    },
  });

  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(id, {
    user_metadata: {
      name: fullName,
    },
  });

  revalidatePath("/dashboard/users");
  return { success: true, message: "Cập nhật người dùng thành công." };
}

async function toggleUserStatus(input: ToggleUserStatusInput): Promise<ActionResult> {
  const { profile: actor } = await requireRole("ADMIN");

  const id = input.id.trim();
  if (!id) {
    return { success: false, message: "Thiếu định danh người dùng." };
  }

  const target = await prisma.profile.findUnique({
    where: { id },
    select: { id: true, role: true, isBlocked: true },
  });

  if (!target) {
    return { success: false, message: "Không tìm thấy người dùng cần cập nhật." };
  }

  if (target.id === actor.id && input.nextBlockedState) {
    return { success: false, message: "Bạn không thể tự vô hiệu hóa chính mình." };
  }

  if (target.role === "ADMIN" && input.nextBlockedState) {
    const activeAdminCount = await prisma.profile.count({
      where: {
        role: "ADMIN",
        isBlocked: false,
      },
    });

    if (activeAdminCount <= 1) {
      return { success: false, message: "Không thể vô hiệu hóa quản trị viên cuối cùng." };
    }
  }

  await prisma.profile.update({
    where: { id },
    data: { isBlocked: input.nextBlockedState },
  });

  revalidatePath("/dashboard/users");
  return {
    success: true,
    message: input.nextBlockedState
      ? "Đã vô hiệu hóa tài khoản người dùng."
      : "Đã kích hoạt lại tài khoản người dùng.",
  };
}

export { createUser, toggleUserStatus, updateUser };
