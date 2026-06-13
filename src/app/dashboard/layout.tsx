import Link from "next/link";
import { Briefcase } from "lucide-react";
import { requireCurrentAccount } from "@/lib/auth/session";
import { DashboardNav, type DashboardNavItem } from "@/components/dashboard/dashboard-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile } = await requireCurrentAccount();

  const navItems: DashboardNavItem[] = [
    { href: "/dashboard", label: "Tổng quan" },
    { href: "/dashboard/jobs", label: "Việc làm" },
    { href: "/dashboard/reminders", label: "Nhắc nhở" },
  ];

  if (profile.role === "ADMIN") {
    navItems.splice(1, 0, { href: "/dashboard/users", label: "Người dùng" });
    navItems.push({ href: "/dashboard/job-sources", label: "Nguồn việc làm" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2 text-foreground">
              <Briefcase className="size-6 text-primary" />
              <span className="text-lg font-semibold tracking-tight">JobTracker</span>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu
                email={profile.email}
                fullName={profile.fullName}
                role={profile.role}
              />
            </div>
          </div>

          <DashboardNav items={navItems} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8">
        {children}
      </main>
    </div>
  );
}
