"use client";

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
  signOutAction: () => void | Promise<void>;
}

function getInitials(name?: string | null, email?: string) {
  const source = name?.trim() || email || "U";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function UserMenu({ email, role, fullName, signOutAction }: UserMenuProps) {
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
        <form action={signOutAction}>
          <DropdownMenuItem render={<button type="submit" className="w-full" />}>Đăng xuất</DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { UserMenu };
