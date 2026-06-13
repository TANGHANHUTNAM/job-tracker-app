import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function POST(request: NextRequest) {
  const cookieResponse = NextResponse.next();
  const supabase = createRouteHandlerClient(request, cookieResponse);

  await supabase.auth.signOut();

  const finalResponse = NextResponse.json({ success: true, redirectTo: "/sign-in" });
  const setCookie = cookieResponse.headers.get("Set-Cookie");
  if (setCookie) {
    finalResponse.headers.set("Set-Cookie", setCookie);
  }
  return finalResponse;
}
