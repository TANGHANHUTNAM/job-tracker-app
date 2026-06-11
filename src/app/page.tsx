import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Briefcase, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-lg space-y-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <Briefcase className="size-10 text-primary" />
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">JobTracker</h1>
        </div>

        <p className="text-lg text-muted-foreground">
          Theo dõi đơn ứng tuyển, quản lý lịch phỏng vấn và tối ưu hành trình tìm việc của bạn trong một nơi duy nhất.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/sign-up"
            className={buttonVariants({ variant: "default", size: "lg" })}
          >
            Bắt đầu ngay
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
