"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function SignUpPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string>("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const nextErrors: { email?: string; password?: string } = {};
    const email = (formData.get("email") as string | null)?.trim() ?? "";
    const password = (formData.get("password") as string | null)?.trim() ?? "";

    if (!email) nextErrors.email = "Vui lòng nhập email.";
    if (!password) nextErrors.password = "Vui lòng nhập mật khẩu.";
    else if (password.length < 6) nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsPending(true);
    setError("");

    try {
      const res = await fetch("/auth/sign-up", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.redirectTo) {
        router.push(data.redirectTo);
      }
    } catch {
      setError("Không thể kết nối. Vui lòng thử lại.");
    } finally {
      setIsPending(false);
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
          <h1 className="text-2xl font-bold tracking-tight">Tạo tài khoản</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tạo tài khoản JobTracker miễn phí.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Họ và tên</FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Nguyễn Văn A"
                autoComplete="name"
              />
            </Field>

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
                placeholder="Tối thiểu 6 ký tự"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <FieldError>{errors.password}</FieldError>
            </Field>
          </FieldGroup>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang tạo tài khoản...
              </>
            ) : (
              "Đăng ký"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
