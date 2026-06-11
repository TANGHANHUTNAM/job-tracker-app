"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardNavItem = {
  href: string;
  label: string;
};

interface DashboardNavProps {
  items: DashboardNavItem[];
}

function DashboardNav({ items }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
      {items.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" }),
              "shrink-0 text-sm"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export { DashboardNav };
export type { DashboardNavItem };
