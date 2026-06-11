import { Briefcase } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Left side - branding */}
      <div className="hidden w-1/2 bg-primary lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <Link
          href="/"
          className="flex items-center gap-2 text-primary-foreground"
        >
          <Briefcase className="size-8" />
          <span className="text-2xl font-semibold tracking-tight">JobTracker</span>
        </Link>
        <p className="mt-4 max-w-sm text-center text-primary-foreground/80">
          Theo dõi việc ứng tuyển, quản lý phỏng vấn và tiến gần hơn tới công việc mơ ước.
        </p>
      </div>

      {/* Right side - form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        {children}
      </div>
    </div>
  );
}
