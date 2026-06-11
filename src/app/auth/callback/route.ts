import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  FLASH_TOAST_COOKIE,
  flashToastCookieOptions,
  serializeFlashToast,
} from "@/lib/toast";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/sign-in";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await supabase.auth.signOut();

      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.set(
        FLASH_TOAST_COOKIE,
        serializeFlashToast({
          type: "success",
          message: "Xác thực email thành công. Vui lòng đăng nhập để tiếp tục.",
        }),
        flashToastCookieOptions
      );

      return response;
    }
  }

  const response = NextResponse.redirect(`${origin}/sign-in`);
  response.cookies.set(
    FLASH_TOAST_COOKIE,
    serializeFlashToast({
      type: "error",
      message: "Xác thực email thất bại. Vui lòng thử lại từ liên kết trong email.",
    }),
    flashToastCookieOptions
  );

  return response;
}
