"use client";

import * as React from "react";
import { type AppRole } from "@prisma/client";
import { PencilIcon, PlusIcon, UserRoundCog } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { createUser, toggleUserStatus, updateUser } from "./actions";
import type {
  CreateUserInput,
  ToggleUserStatusInput,
  UpdateUserInput,
  UserRoleFilter,
  UserStatusFilter,
} from "./types";

type UserRow = {
  id: string;
  email: string;
  fullName: string | null;
  role: AppRole;
  isBlocked: boolean;
  createdAt: Date;
};

type Filters = {
  q: string;
  role: UserRoleFilter;
  status: UserStatusFilter;
  sort: "asc" | "desc";
};

type Pagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type FormState = {
  id?: string;
  fullName: string;
  email: string;
  password: string;
  role: AppRole;
};

const initialFormState: FormState = {
  fullName: "",
  email: "",
  password: "",
  role: "USER",
};

interface UsersManagerProps {
  users: UserRow[];
  filters: Filters;
  pagination: Pagination;
}

function UsersManager({ users, filters, pagination }: UsersManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserRow | null>(null);
  const [userToToggle, setUserToToggle] = React.useState<UserRow | null>(null);
  const [form, setForm] = React.useState<FormState>(initialFormState);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const [isPending, startTransition] = React.useTransition();

  const updateQuery = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const resetForm = React.useCallback(() => {
    setEditingUser(null);
    setForm(initialFormState);
    setErrors({});
  }, []);

  const openCreateDialog = React.useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  const openEditDialog = React.useCallback((user: UserRow) => {
    setEditingUser(user);
    setForm({
      id: user.id,
      fullName: user.fullName ?? "",
      email: user.email,
      password: "",
      role: user.role,
    });
    setErrors({});
    setIsDialogOpen(true);
  }, []);

  const handleDialogChange = React.useCallback(
    (open: boolean) => {
      setIsDialogOpen(open);
      if (!open) {
        resetForm();
      }
    },
    [resetForm]
  );

  const handleChange = React.useCallback((field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      return { ...current, [field]: undefined };
    });
  }, []);

  const validateForm = React.useCallback(() => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    const isCreateMode = !editingUser;

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ tên.";
    }

    if (!form.role) {
      nextErrors.role = "Vui lòng chọn vai trò.";
    }

    if (isCreateMode) {
      if (!form.email.trim()) {
        nextErrors.email = "Vui lòng nhập email.";
      }

      if (!form.password.trim()) {
        nextErrors.password = "Vui lòng nhập mật khẩu.";
      } else if (form.password.trim().length < 6) {
        nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [editingUser, form.email, form.fullName, form.password, form.role]);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!validateForm()) {
        toast.error("Vui lòng kiểm tra lại các trường bắt buộc.");
        return;
      }

      startTransition(async () => {
        const result = editingUser
          ? await updateUser({
              id: form.id ?? "",
              fullName: form.fullName,
              role: form.role,
            } satisfies UpdateUserInput)
          : await createUser({
              fullName: form.fullName,
              email: form.email,
              password: form.password,
              role: form.role,
            } satisfies CreateUserInput);

        if (result.success) {
          toast.success(result.message);
          setIsDialogOpen(false);
          resetForm();
          router.refresh();
          return;
        }

        toast.error(result.message);
      });
    },
    [editingUser, form, resetForm, router, validateForm]
  );

  const handleToggleStatus = React.useCallback(() => {
    if (!userToToggle) {
      return;
    }

    startTransition(async () => {
      const result = await toggleUserStatus({
        id: userToToggle.id,
        nextBlockedState: !userToToggle.isBlocked,
      } satisfies ToggleUserStatusInput);

      if (result.success) {
        toast.success(result.message);
        setUserToToggle(null);
        router.refresh();
        return;
      }

      toast.error(result.message);
    });
  }, [router, userToToggle]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Người dùng"
        description="Quản trị tài khoản người dùng, phân quyền và trạng thái hoạt động trong hệ thống."
        action={
          <Button type="button" onClick={openCreateDialog}>
            <PlusIcon data-icon="inline-start" />
            Tạo người dùng
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>Tìm kiếm, lọc và quản trị tài khoản người dùng theo vai trò hoặc trạng thái.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_180px_auto]">
            <SearchInput
              key={filters.q}
              defaultValue={filters.q}
              debounceMs={400}
              onValueChange={(value) => {
                if (value === filters.q) {
                  return;
                }

                updateQuery({ q: value || null, page: "1" });
              }}
              placeholder="Tìm theo họ tên hoặc email"
            />

            <Select
              items={[
                { label: "Tất cả vai trò", value: "all" },
                { label: "Quản trị viên", value: "ADMIN" },
                { label: "Người dùng", value: "USER" },
              ]}
              value={filters.role || "all"}
              onValueChange={(value) => updateQuery({ role: value === "all" ? null : value, page: "1" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Lọc theo vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                  <SelectItem value="USER">Người dùng</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              items={[
                { label: "Tất cả trạng thái", value: "all" },
                { label: "Đang hoạt động", value: "active" },
                { label: "Đã vô hiệu hóa", value: "inactive" },
              ]}
              value={filters.status || "all"}
              onValueChange={(value) => updateQuery({ status: value === "all" ? null : value, page: "1" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Đã vô hiệu hóa</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              items={[
                { label: "Mới nhất", value: "desc" },
                { label: "Cũ nhất", value: "asc" },
              ]}
              value={filters.sort}
              onValueChange={(value) => updateQuery({ sort: value, page: "1" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sắp xếp theo ngày tạo" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="desc">Mới nhất</SelectItem>
                  <SelectItem value="asc">Cũ nhất</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              className="w-full sm:w-auto"
              variant="ghost"
              onClick={() => updateQuery({ q: null, role: null, status: null, sort: "desc", page: null })}
            >
              Xóa bộ lọc
            </Button>
          </div>

          {users.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserRoundCog />
                </EmptyMedia>
                <EmptyTitle>Không tìm thấy người dùng</EmptyTitle>
                <EmptyDescription>Không có tài khoản nào khớp với bộ lọc hiện tại.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName ?? "Chưa cập nhật"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                        {user.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isBlocked ? "destructive" : "outline"}>
                        {user.isBlocked ? "Đã vô hiệu hóa" : "Đang hoạt động"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                          <PencilIcon data-icon="inline-start" />
                          Chỉnh sửa
                        </Button>
                        <Button
                          type="button"
                          variant={user.isBlocked ? "outline" : "destructive"}
                          size="sm"
                          onClick={() => setUserToToggle(user)}
                        >
                          {user.isBlocked ? "Kích hoạt" : "Vô hiệu hóa"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Trang {pagination.page}/{pagination.totalPages} · Tổng {pagination.totalCount} người dùng
            </span>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => updateQuery({ page: String(pagination.page - 1) })}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => updateQuery({ page: String(pagination.page + 1) })}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Cập nhật người dùng" : "Tạo người dùng mới"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Chỉnh sửa họ tên và vai trò của người dùng."
                : "Tạo tài khoản mới với email, mật khẩu và phân quyền ban đầu."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="fullName">Họ tên <span className="text-destructive">*</span></FieldLabel>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(event) => handleChange("fullName", event.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  required
                />
                <FieldError>{errors.fullName}</FieldError>
              </Field>

              {!editingUser && (
                <>
                  <Field>
                    <FieldLabel htmlFor="email">Email <span className="text-destructive">*</span></FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(event) => handleChange("email", event.target.value)}
                      placeholder="name@example.com"
                      required
                    />
                    <FieldError>{errors.email}</FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="password">Mật khẩu <span className="text-destructive">*</span></FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(event) => handleChange("password", event.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      required
                    />
                    <FieldError>{errors.password}</FieldError>
                  </Field>
                </>
              )}

              <Field>
                <FieldLabel htmlFor="role">Vai trò <span className="text-destructive">*</span></FieldLabel>
                <Select items={[]} value={form.role} onValueChange={(value) => handleChange("role", value ?? "") }>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="USER">Người dùng</SelectItem>
                      <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError>{errors.role}</FieldError>
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleDialogChange(false)} disabled={isPending}>
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {editingUser ? "Lưu thay đổi" : "Tạo người dùng"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(userToToggle)}
        onOpenChange={(open) => {
          if (!open) {
            setUserToToggle(null);
          }
        }}
        title={userToToggle?.isBlocked ? "Kích hoạt tài khoản?" : "Vô hiệu hóa tài khoản?"}
        description={
          userToToggle?.isBlocked
            ? `Tài khoản ${userToToggle.email} sẽ có thể đăng nhập và sử dụng hệ thống trở lại.`
            : `Tài khoản ${userToToggle?.email} sẽ bị chặn đăng nhập mới và bị đăng xuất ở request kế tiếp.`
        }
        confirmLabel={userToToggle?.isBlocked ? "Kích hoạt" : "Vô hiệu hóa"}
        onConfirm={handleToggleStatus}
      />
    </div>
  );
}

export { UsersManager };
