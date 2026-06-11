"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Briefcase, Loader2 } from "lucide-react";
import { signIn, type AuthResult } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState<AuthResult, FormData>(
    signIn,
    {}
  );
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const nextErrors: { email?: string; password?: string } = {};
    const email = (formData.get("email") as string | null)?.trim() ?? "";
    const password = (formData.get("password") as string | null)?.trim() ?? "";

    if (!email) {
      nextErrors.email = "Vui lòng nhập email.";
    }

    if (!password) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Mobile logo */}
      <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
        <Briefcase className="size-6" />
        <span className="text-xl font-bold">JobTracker</span>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chào mừng quay lại</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Đăng nhập để tiếp tục với JobTracker.
          </p>
        </div>

        {state.error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email <span className="text-destructive">*</span></FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
              <FieldError>{errors.email}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Mật khẩu <span className="text-destructive">*</span></FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Nhập mật khẩu của bạn"
                required
                autoComplete="current-password"
              />
              <FieldError>{errors.password}</FieldError>
            </Field>
          </FieldGroup>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
