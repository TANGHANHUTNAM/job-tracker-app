import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function POST(request: NextRequest) {
  const { supabase, applyCookies } = createRouteHandlerClient(request);

  await supabase.auth.signOut();

  const response = NextResponse.json({ success: true, redirectTo: "/sign-in" });
  applyCookies(response);
  return response;
}
