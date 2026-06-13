import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/**
 * Creates a Supabase client for Route Handlers that collects cookies
 * and provides an `applyCookies` function to write them to the final response.
 *
 * Usage:
 *   const { supabase, applyCookies } = createRouteHandlerClient(request);
 *   // ... supabase operations ...
 *   const response = NextResponse.json({ ... });
 *   applyCookies(response);
 *   return response;
 */
export function createRouteHandlerClient(request: NextRequest) {
  const collectedCookies: Array<{
    name: string;
    value: string;
    options?: CookieOptions;
  }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: CookieOptions;
          }>,
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            collectedCookies.push({ name, value, options });
          });
        },
      },
    },
  );

  function applyCookies(response: NextResponse) {
    for (const { name, value, options } of collectedCookies) {
      response.cookies.set(name, value, options);
    }
  }

  return { supabase, applyCookies };
}
