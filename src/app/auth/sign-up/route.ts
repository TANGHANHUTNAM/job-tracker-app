import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import {
  FLASH_TOAST_COOKIE,
  flashToastCookieOptions,
  serializeFlashToast,
} from "@/lib/toast";

function getSiteUrl(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  const { supabase, applyCookies } = createRouteHandlerClient(request);
  const siteUrl = await getSiteUrl(request);

  const formData = await request.formData();
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string) ?? "";
  const name = (formData.get("name") as string | null)?.trim() ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Vui lòng nhập email và mật khẩu." });
  }

  if (password.length < 6) {
    return NextResponse.json({
      error: "Mật khẩu phải có ít nhất 6 ký tự.",
    });
  }

  const existingProfile = await prisma.profile.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingProfile) {
    return NextResponse.json({ error: "Tài khoản này đã được đăng ký." });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split("@")[0],
      },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/sign-in`,
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return NextResponse.json({ error: "Tài khoản này đã được đăng ký." });
    }
    return NextResponse.json({ error: error.message });
  }

  if (!data.user) {
    return NextResponse.json({
      error: "Không thể hoàn tất đăng ký. Vui lòng thử lại.",
    });
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
    return NextResponse.json({
      error:
        "Bạn cần bật xác thực email trong Supabase để hoàn tất luồng đăng ký.",
    });
  }

  const response = NextResponse.json({ success: true, redirectTo: "/sign-in" });
  applyCookies(response);
  response.cookies.set(
    FLASH_TOAST_COOKIE,
    serializeFlashToast({
      type: "success",
      message:
        "Đăng ký thành công. Vui lòng xác thực email trước khi đăng nhập.",
    }),
    flashToastCookieOptions,
  );
  return response;
}
