"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { setFlashToast } from "@/lib/toast-server";

export type AuthResult = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
};

async function getSiteUrl() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : null;
}

export async function signUp(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string | null)?.trim() ?? "";

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu." };
  }

  if (password.length < 6) {
    return { error: "Mật khẩu phải có ít nhất 6 ký tự." };
  }

  const existingProfile = await prisma.profile.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingProfile) {
    return { error: "Tài khoản này đã được đăng ký." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split("@")[0],
      },
      ...(siteUrl
        ? {
            emailRedirectTo: `${siteUrl}/auth/callback?next=/sign-in`,
          }
        : {}),
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Tài khoản này đã được đăng ký." };
    }
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Không thể hoàn tất đăng ký. Vui lòng thử lại." };
  }

  await prisma.profile.upsert({
    where: { id: data.user.id },
    update: {
      email,
      fullName: name || email.split("@")[0],
    },
    create: {
      id: data.user.id,
      email,
      fullName: name || email.split("@")[0],
    },
  });

  if (data.session) {
    await supabase.auth.signOut();
    return {
      error: "Bạn cần bật xác thực email trong Supabase để hoàn tất luồng đăng ký.",
    };
  }

  revalidatePath("/", "layout");
  await setFlashToast({
    type: "success",
    message: "Đăng ký thành công. Vui lòng xác thực email trước khi đăng nhập.",
  });
  return { success: true, redirectTo: "/sign-in" };
}

export async function signIn(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const supabase = await createClient();

  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { error: "Email hoặc mật khẩu không đúng." };
    }
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Vui lòng xác thực email trước khi đăng nhập." };
    }
    return { error: error.message };
  }

  const profile = await prisma.profile.findUnique({
    where: { email },
    select: { isBlocked: true },
  });

  if (profile?.isBlocked) {
    await supabase.auth.signOut();
    return { error: "Tài khoản của bạn đã bị vô hiệu hóa." };
  }

  revalidatePath("/", "layout");
  return { success: true, redirectTo: "/dashboard" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return { success: true, redirectTo: "/sign-in" };
}
