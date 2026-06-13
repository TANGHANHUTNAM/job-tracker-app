import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: false });
  const supabase = createRouteHandlerClient(request, response);

  await supabase.auth.signOut();

  return NextResponse.json({ success: true, redirectTo: "/sign-in" });
}
