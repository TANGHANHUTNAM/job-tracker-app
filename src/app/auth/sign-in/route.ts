import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function POST(request: NextRequest) {
  const { supabase, applyCookies } = createRouteHandlerClient(request);

  const formData = await request.formData();
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!email || !password) {
    return NextResponse.json({
      error: "Vui lòng nhập email và mật khẩu.",
    });
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng." });
    }
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return NextResponse.json({
        error: "Vui lòng xác thực email trước khi đăng nhập.",
      });
    }
    return NextResponse.json({ error: error.message });
  }

  const profile = await prisma.profile.findUnique({
    where: { email },
    select: { isBlocked: true },
  });

  if (profile?.isBlocked) {
    await supabase.auth.signOut();
    return NextResponse.json({
      error: "Tài khoản của bạn đã bị vô hiệu hóa.",
    });
  }

  const response = NextResponse.json({ success: true, redirectTo: "/dashboard" });
  applyCookies(response);
  return response;
}
