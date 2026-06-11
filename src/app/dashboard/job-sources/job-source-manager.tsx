"use client";

import * as React from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import {
  createJobSource,
  deleteJobSource,
  updateJobSource,
} from "./actions";
import type { JobSourceActionInput } from "./types";

type JobSourceRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
};

type FormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
};

const initialFormState: FormState = {
  name: "",
  slug: "",
  description: "",
  sortOrder: "0",
  isActive: true,
};

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface JobSourceManagerProps {
  sources: JobSourceRow[];
}

function JobSourceManager({ sources }: JobSourceManagerProps) {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(initialFormState);
  const [isPending, startTransition] = React.useTransition();
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const [sourceToDelete, setSourceToDelete] = React.useState<JobSourceRow | null>(null);

  const isEditing = Boolean(form.id);

  const resetForm = React.useCallback(() => {
    setForm(initialFormState);
    setErrors({});
  }, []);

  const handleChange = React.useCallback(
    (field: keyof FormState, value: string | boolean) => {
      setForm((current) => {
        if (field === "name" && typeof value === "string") {
          const shouldSyncSlug = current.slug.trim() === "" || current.slug === toSlug(current.name);

          return {
            ...current,
            name: value,
            slug: shouldSyncSlug ? toSlug(value) : current.slug,
          };
        }

        return {
          ...current,
          [field]: value,
        };
      });
      setErrors((current) => {
        if (!current[field]) {
          return current;
        }

        return { ...current, [field]: undefined };
      });
    },
    []
  );

  const validateForm = React.useCallback(() => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) {
      nextErrors.name = "Vui lòng nhập tên nguồn.";
    }

    if (!form.slug.trim()) {
      nextErrors.slug = "Vui lòng nhập slug.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form.name, form.slug]);

  const handleEdit = React.useCallback((source: JobSourceRow) => {
    setForm({
      id: source.id,
      name: source.name,
      slug: source.slug,
      description: source.description ?? "",
      sortOrder: String(source.sortOrder),
      isActive: source.isActive,
    });
  }, []);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!validateForm()) {
        toast.error("Vui lòng kiểm tra lại các trường bắt buộc.");
        return;
      }

      const payload: JobSourceActionInput = {
        id: form.id,
        name: form.name,
        slug: form.slug,
        description: form.description,
        sortOrder: Number(form.sortOrder || 0),
        isActive: form.isActive,
      };

      startTransition(async () => {
        const result = form.id
          ? await updateJobSource(payload)
          : await createJobSource(payload);

        if (result.success) {
          toast.success(result.message);
          resetForm();
          router.refresh();
          return;
        }

        toast.error(result.message);
      });
    },
    [form, resetForm, router, validateForm]
  );

  const handleDelete = React.useCallback(
    () => {
      if (!sourceToDelete) {
        return;
      }

      startTransition(async () => {
        const result = await deleteJobSource(sourceToDelete.id);

        if (result.success) {
          toast.success(result.message);
          if (form.id === sourceToDelete.id) {
            resetForm();
          }
          setSourceToDelete(null);
          router.refresh();
          return;
        }

        toast.error(result.message);
      });
    },
    [form.id, resetForm, router, sourceToDelete]
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Cập nhật nguồn việc làm" : "Tạo nguồn việc làm mới"}</CardTitle>
          <CardDescription>
            Quản trị viên có thể thêm, chỉnh sửa hoặc xóa các nguồn việc làm dùng trong hệ thống.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <FieldGroup className="md:col-span-2 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              <Field>
                <FieldLabel htmlFor="name">Tên nguồn <span className="text-destructive">*</span></FieldLabel>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  placeholder="Ví dụ: LinkedIn"
                  required
                />
                <FieldError>{errors.name}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="slug">Slug <span className="text-destructive">*</span></FieldLabel>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(event) => handleChange("slug", event.target.value)}
                  placeholder="vi-du-linkedin"
                  required
                />
                <FieldError>{errors.slug}</FieldError>
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="description">Mô tả</FieldLabel>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(event) => handleChange("description", event.target.value)}
                  placeholder="Mô tả ngắn về nguồn việc làm này"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="sortOrder">Thứ tự hiển thị</FieldLabel>
                <Input
                  id="sortOrder"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(event) => handleChange("sortOrder", event.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="isActive">Trạng thái</FieldLabel>
                <Select
                  items={[
                    { label: "Đang hoạt động", value: "active" },
                    { label: "Tạm ẩn", value: "inactive" },
                  ]}
                  value={form.isActive ? "active" : "inactive"}
                  onValueChange={(value) => handleChange("isActive", value === "active")}
                >
                  <SelectTrigger id="isActive" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="active">Đang hoạt động</SelectItem>
                      <SelectItem value="inactive">Tạm ẩn</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button className="w-full sm:w-auto" type="submit" disabled={isPending}>
                {isEditing ? <PencilIcon data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
                {isEditing ? "Lưu thay đổi" : "Tạo nguồn mới"}
              </Button>

              {isEditing && (
                <Button className="w-full sm:w-auto" type="button" variant="ghost" onClick={resetForm} disabled={isPending}>
                  Hủy chỉnh sửa
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách nguồn</CardTitle>
          <CardDescription>
            Các thao tác tạo, cập nhật và xóa sẽ hiển thị toast ngay cho người dùng quản trị.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sources.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PlusIcon />
                </EmptyMedia>
                <EmptyTitle>Chưa có nguồn việc làm nào</EmptyTitle>
                <EmptyDescription>
                  Hãy tạo nguồn đầu tiên để bắt đầu quản lý dữ liệu tuyển dụng trong hệ thống.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên nguồn</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Thứ tự</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{source.name}</span>
                        {source.description && (
                          <span className="max-w-md truncate text-xs text-muted-foreground">
                            {source.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{source.slug}</TableCell>
                    <TableCell>{source.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant={source.isActive ? "secondary" : "outline"}>
                        {source.isActive ? "Đang hoạt động" : "Tạm ẩn"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(source.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col justify-end gap-2 sm:flex-row">
                        <Button className="w-full sm:w-auto" type="button" variant="outline" size="sm" onClick={() => handleEdit(source)}>
                          <PencilIcon data-icon="inline-start" />
                          Sửa
                        </Button>
                        <Button
                          className="w-full sm:w-auto"
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setSourceToDelete(source)}
                          disabled={isPending}
                        >
                          <Trash2Icon data-icon="inline-start" />
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(sourceToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setSourceToDelete(null);
          }
        }}
        title="Xóa nguồn việc làm"
        description={`Bạn có chắc muốn xóa nguồn "${sourceToDelete?.name ?? ""}" không?`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { JobSourceManager };
