"use client";

import * as React from "react";
import { type ReminderType } from "@prisma/client";
import { Bell, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteReminder, createReminder, toggleReminderCompletion, updateReminder } from "./actions";
import type { ReminderActionInput, ReminderStatusFilter } from "./types";

type ReminderRow = {
  id: string;
  title: string;
  reminderDate: Date;
  type: ReminderType;
  isCompleted: boolean;
  jobApplicationId: string | null;
  jobLabel: string | null;
  ownerLabel: string;
};

type JobOption = {
  id: string;
  label: string;
};

type Filters = {
  q: string;
  status: ReminderStatusFilter;
  type: ReminderType | "";
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
  title: string;
  reminderDate: string;
  type: ReminderType;
  jobApplicationId: string;
};

const initialFormState: FormState = {
  title: "",
  reminderDate: "",
  type: "CUSTOM",
  jobApplicationId: "",
};

const reminderTypeOptions: Array<{ label: string; value: ReminderType }> = [
  { label: "Follow up", value: "FOLLOW_UP" },
  { label: "Interview", value: "INTERVIEW" },
  { label: "Deadline", value: "DEADLINE" },
  { label: "Custom", value: "CUSTOM" },
];

const reminderTypeLabels: Record<ReminderType, string> = {
  FOLLOW_UP: "Follow up",
  INTERVIEW: "Interview",
  DEADLINE: "Deadline",
  CUSTOM: "Custom",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

interface RemindersManagerProps {
  reminders: ReminderRow[];
  jobs: JobOption[];
  filters: Filters;
  isAdmin: boolean;
  pagination: Pagination;
}

function RemindersManager({ reminders, jobs, filters, isAdmin, pagination }: RemindersManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingReminder, setEditingReminder] = React.useState<ReminderRow | null>(null);
  const [reminderToDelete, setReminderToDelete] = React.useState<ReminderRow | null>(null);
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
    setEditingReminder(null);
    setForm(initialFormState);
    setErrors({});
  }, []);

  const openCreateDialog = React.useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  const openEditDialog = React.useCallback((reminder: ReminderRow) => {
    setEditingReminder(reminder);
    setForm({
      id: reminder.id,
      title: reminder.title,
      reminderDate: new Date(reminder.reminderDate).toISOString().slice(0, 10),
      type: reminder.type,
      jobApplicationId: reminder.jobApplicationId ?? "",
    });
    setErrors({});
    setIsDialogOpen(true);
  }, []);

  const handleDialogChange = React.useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  }, [resetForm]);

  const handleChange = React.useCallback((field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }, []);

  const validateForm = React.useCallback(() => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.title.trim()) {
      nextErrors.title = "Vui lòng nhập tiêu đề nhắc nhở.";
    }

    if (!form.reminderDate.trim()) {
      nextErrors.reminderDate = "Vui lòng chọn ngày nhắc.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form.reminderDate, form.title]);

  const handleSubmit = React.useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại các trường bắt buộc.");
      return;
    }

    startTransition(async () => {
      const payload: ReminderActionInput = {
        id: form.id,
        title: form.title,
        reminderDate: form.reminderDate,
        type: form.type,
        jobApplicationId: form.jobApplicationId,
      };

      const result = editingReminder ? await updateReminder(payload) : await createReminder(payload);

      if (result.success) {
        toast.success(result.message);
        setIsDialogOpen(false);
        resetForm();
        router.refresh();
        return;
      }

      toast.error(result.message);
    });
  }, [editingReminder, form, resetForm, router, validateForm]);

  const handleDelete = React.useCallback(() => {
    if (!reminderToDelete) return;

    startTransition(async () => {
      const result = await deleteReminder(reminderToDelete.id);
      if (result.success) {
        toast.success(result.message);
        setReminderToDelete(null);
        router.refresh();
        return;
      }
      toast.error(result.message);
    });
  }, [reminderToDelete, router]);

  const handleToggleCompletion = React.useCallback((id: string) => {
    startTransition(async () => {
      const result = await toggleReminderCompletion(id);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
        return;
      }
      toast.error(result.message);
    });
  }, [router]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Nhắc nhở"
        description="Theo dõi các mốc follow up, interview, deadline và việc cần xử lý trong quá trình ứng tuyển."
        action={<Button onClick={openCreateDialog}><PlusIcon data-icon="inline-start" />Tạo nhắc nhở</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhắc nhở</CardTitle>
          <CardDescription>Tìm kiếm, lọc và quản lý reminder theo trạng thái hoặc loại nhắc.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_180px_auto]">
            <SearchInput
              key={filters.q}
              defaultValue={filters.q}
              debounceMs={400}
              onValueChange={(value) => {
                if (value === filters.q) return;
                updateQuery({ q: value || null, page: "1" });
              }}
              placeholder="Tìm theo tiêu đề nhắc nhở"
            />

            <Select
              items={[
                { label: "Tất cả trạng thái", value: "all" },
                { label: "Đang mở", value: "open" },
                { label: "Đã hoàn thành", value: "completed" },
              ]}
              value={filters.status || "all"}
              onValueChange={(value) => updateQuery({ status: value === "all" ? null : value, page: "1" })}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="open">Đang mở</SelectItem>
                  <SelectItem value="completed">Đã hoàn thành</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              items={[{ label: "Tất cả loại nhắc", value: "all" }, ...reminderTypeOptions.map((option) => ({ label: option.label, value: option.value }))]}
              value={filters.type || "all"}
              onValueChange={(value) => updateQuery({ type: value === "all" ? null : value, page: "1" })}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tất cả loại nhắc</SelectItem>
                  {reminderTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              items={[{ label: "Sắp đến hạn", value: "asc" }, { label: "Xa hơn", value: "desc" }]}
              value={filters.sort}
              onValueChange={(value) => updateQuery({ sort: value, page: "1" })}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="asc">Sắp đến hạn</SelectItem>
                  <SelectItem value="desc">Xa hơn</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button variant="ghost" className="w-full sm:w-auto" onClick={() => updateQuery({ q: null, status: null, type: null, sort: "asc", page: null })}>
              Xóa bộ lọc
            </Button>
          </div>

          {reminders.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Bell /></EmptyMedia>
                <EmptyTitle>Chưa có nhắc nhở phù hợp</EmptyTitle>
                <EmptyDescription>Hãy tạo reminder mới hoặc điều chỉnh bộ lọc để xem thêm kết quả.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Công việc liên kết</TableHead>
                  {isAdmin && <TableHead>Người sở hữu</TableHead>}
                  <TableHead>Loại nhắc</TableHead>
                  <TableHead>Ngày nhắc</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell className="font-medium">{reminder.title}</TableCell>
                    <TableCell className="text-muted-foreground">{reminder.jobLabel ?? "Không gắn job"}</TableCell>
                    {isAdmin && <TableCell className="text-muted-foreground">{reminder.ownerLabel}</TableCell>}
                    <TableCell>
                      <Badge variant="secondary">{reminderTypeLabels[reminder.type]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(reminder.reminderDate)}</TableCell>
                    <TableCell>
                      <Badge variant={reminder.isCompleted ? "outline" : "default"}>
                        {reminder.isCompleted ? "Đã hoàn thành" : "Đang mở"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(reminder)}>
                          <PencilIcon data-icon="inline-start" />Chỉnh sửa
                        </Button>
                        <Button size="sm" variant={reminder.isCompleted ? "outline" : "secondary"} onClick={() => handleToggleCompletion(reminder.id)}>
                          {reminder.isCompleted ? "Mở lại" : "Hoàn thành"}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setReminderToDelete(reminder)}>
                          <Trash2Icon data-icon="inline-start" />Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {pagination.totalCount > 0 && (
            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Hiển thị {(pagination.page - 1) * pagination.pageSize + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} / {pagination.totalCount} nhắc nhở
              </p>
              <div className="flex gap-2">
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
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReminder ? "Chỉnh sửa nhắc nhở" : "Tạo nhắc nhở mới"}</DialogTitle>
            <DialogDescription>Thiết lập một mốc theo dõi cho follow up, interview, deadline hoặc việc cá nhân.</DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title">Tiêu đề <span className="text-destructive">*</span></FieldLabel>
                <Input id="title" value={form.title} onChange={(event) => handleChange("title", event.target.value)} required />
                <FieldError>{errors.title}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="reminderDate">Ngày nhắc <span className="text-destructive">*</span></FieldLabel>
                <DatePicker id="reminderDate" value={form.reminderDate} onValueChange={(value) => handleChange("reminderDate", value)} />
                <FieldError>{errors.reminderDate}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="type">Loại nhắc</FieldLabel>
                <Select items={reminderTypeOptions} value={form.type} onValueChange={(value) => handleChange("type", value ?? "CUSTOM")}>
                  <SelectTrigger id="type" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {reminderTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="jobApplicationId">Gắn với việc làm</FieldLabel>
                <Select
                  items={[{ label: "Không gắn job", value: "none" }, ...jobs.map((job) => ({ label: job.label, value: job.id }))]}
                  value={form.jobApplicationId || "none"}
                  onValueChange={(value) => handleChange("jobApplicationId", value === "none" ? "" : (value ?? ""))}
                >
                  <SelectTrigger id="jobApplicationId" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">Không gắn job</SelectItem>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>{job.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleDialogChange(false)} disabled={isPending}>Hủy</Button>
              <Button type="submit" disabled={isPending}>{editingReminder ? "Lưu thay đổi" : "Tạo nhắc nhở"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(reminderToDelete)}
        onOpenChange={(open) => { if (!open) setReminderToDelete(null); }}
        title="Xóa nhắc nhở?"
        description={`Nhắc nhở "${reminderToDelete?.title ?? ""}" sẽ bị xóa vĩnh viễn.`}
        confirmLabel="Xóa"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { RemindersManager };
