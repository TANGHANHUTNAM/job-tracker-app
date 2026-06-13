"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface UserMenuProps {
  email: string;
  role: "ADMIN" | "USER";
  fullName?: string | null;
}

function getInitials(name?: string | null, email?: string) {
  const source = name?.trim() || email || "U";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function UserMenu({ email, role, fullName }: UserMenuProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      const res = await fetch("/auth/sign-out", { method: "POST" });
      const data = await res.json();
      if (data.redirectTo) {
        router.push(data.redirectTo);
      } else {
        router.push("/sign-in");
      }
    } catch {
      router.push("/sign-in");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Mở menu người dùng" />}
      >
        <Avatar>
          <AvatarFallback>{getInitials(fullName, email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Thông tin tài khoản</DropdownMenuLabel>
          <div className="flex flex-col gap-1 px-1.5 py-1 text-sm">
            <span className="font-medium text-foreground">{fullName || "Chưa cập nhật"}</span>
            <span className="break-all text-muted-foreground">{email}</span>
            <div className="pt-1">
              <Badge variant={role === "ADMIN" ? "default" : "secondary"}>
                {role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
              </Badge>
            </div>
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <button
              type="button"
              className="w-full"
              onClick={handleSignOut}
              disabled={isSigningOut}
            />
          }
        >
          {isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { UserMenu };
