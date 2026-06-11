"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, PlusIcon } from "lucide-react";
import { type JobStatus, type JobType } from "@prisma/client";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
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
import { JobTable } from "@/components/ui/job-table";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createJob,
  deleteJob,
  updateJob,
  updateJobStatus,
} from "./actions";
import type { JobActionInput } from "./types";

type SourceOption = {
  id: string;
  name: string;
};

type JobListItem = {
  id: string;
  companyName: string;
  jobTitle: string;
  jobUrl: string | null;
  location: string | null;
  salaryRange: string | null;
  jobType: JobType | null;
  status: JobStatus;
  appliedDate: Date | null;
  createdAt: Date;
  sourceId: string | null;
  sourceName: string | null;
  deadline: Date | null;
  description: string | null;
  notes: string | null;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type Filters = {
  q: string;
  source: string;
  jobType: string;
  status: string;
  sort: "asc" | "desc";
};

type FormState = {
  id?: string;
  companyName: string;
  jobTitle: string;
  jobUrl: string;
  location: string;
  salaryRange: string;
  jobType: JobType | "";
  sourceId: string;
  status: JobStatus;
  appliedDate: string;
  deadline: string;
  description: string;
  notes: string;
};

const initialFormState: FormState = {
  companyName: "",
  jobTitle: "",
  jobUrl: "",
  location: "",
  salaryRange: "",
  jobType: "",
  sourceId: "",
  status: "SAVED",
  appliedDate: "",
  deadline: "",
  description: "",
  notes: "",
};

const jobTypeOptions: Array<{ label: string; value: JobType | "" }> = [
  { label: "Chưa chọn", value: "" },
  { label: "Toàn thời gian", value: "FULL_TIME" },
  { label: "Bán thời gian", value: "PART_TIME" },
  { label: "Thực tập", value: "INTERNSHIP" },
  { label: "Hợp đồng", value: "CONTRACT" },
  { label: "Freelance", value: "FREELANCE" },
  { label: "Remote", value: "REMOTE" },
  { label: "Hybrid", value: "HYBRID" },
  { label: "Onsite", value: "ONSITE" },
];

const statusOptions: Array<{ label: string; value: JobStatus }> = [
  { label: "Đã lưu", value: "SAVED" },
  { label: "Đã ứng tuyển", value: "APPLIED" },
  { label: "Phỏng vấn", value: "INTERVIEWING" },
  { label: "Nhận offer", value: "OFFER" },
  { label: "Từ chối", value: "REJECTED" },
  { label: "Lưu trữ", value: "ARCHIVED" },
];

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

interface JobsManagerProps {
  jobs: JobListItem[];
  sources: SourceOption[];
  pagination: Pagination;
  filters: Filters;
}

function JobsManager({ jobs, sources, pagination, filters }: JobsManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [editingJob, setEditingJob] = React.useState<JobListItem | null>(null);
  const [jobToDelete, setJobToDelete] = React.useState<JobListItem | null>(null);
  const [form, setForm] = React.useState<FormState>(initialFormState);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});

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

  const openCreateDialog = React.useCallback(() => {
    setEditingJob(null);
    setForm(initialFormState);
    setIsDialogOpen(true);
  }, []);

  const openEditDialog = React.useCallback((jobId: string) => {
    const job = jobs.find((item) => item.id === jobId);

    if (!job) {
      toast.error("Không tìm thấy việc làm cần chỉnh sửa.");
      return;
    }

    setEditingJob(job);
    setForm({
      id: job.id,
      companyName: job.companyName,
      jobTitle: job.jobTitle,
      jobUrl: job.jobUrl ?? "",
      location: job.location ?? "",
      salaryRange: job.salaryRange ?? "",
      jobType: job.jobType ?? "",
      sourceId: job.sourceId ?? "",
      status: job.status,
      appliedDate: toDateInputValue(job.appliedDate),
      deadline: toDateInputValue(job.deadline),
      description: job.description ?? "",
      notes: job.notes ?? "",
    });
    setIsDialogOpen(true);
  }, [jobs]);

  const resetForm = React.useCallback(() => {
    setEditingJob(null);
    setForm(initialFormState);
    setErrors({});
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

  const handleFormChange = React.useCallback(
    (field: keyof FormState, value: string) => {
      setForm((current) => ({ ...current, [field]: value }));
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

    if (!form.companyName.trim()) {
      nextErrors.companyName = "Vui lòng nhập tên công ty.";
    }

    if (!form.jobTitle.trim()) {
      nextErrors.jobTitle = "Vui lòng nhập vị trí ứng tuyển.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form.companyName, form.jobTitle]);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!validateForm()) {
        toast.error("Vui lòng kiểm tra lại các trường bắt buộc.");
        return;
      }

      const payload: JobActionInput = {
        id: form.id,
        companyName: form.companyName,
        jobTitle: form.jobTitle,
        jobUrl: form.jobUrl,
        location: form.location,
        salaryRange: form.salaryRange,
        jobType: form.jobType,
        sourceId: form.sourceId,
        status: form.status,
        appliedDate: form.appliedDate,
        deadline: form.deadline,
        description: form.description,
        notes: form.notes,
      };

      startTransition(async () => {
        const result = editingJob ? await updateJob(payload) : await createJob(payload);

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
    [editingJob, form, resetForm, router, validateForm]
  );

  const handleDelete = React.useCallback(() => {
    if (!jobToDelete) {
      return;
    }

    startTransition(async () => {
      const result = await deleteJob(jobToDelete.id);

      if (result.success) {
        toast.success(result.message);
        setJobToDelete(null);
        router.refresh();
        return;
      }

      toast.error(result.message);
    });
  }, [jobToDelete, router]);

  const handleStatusChange = React.useCallback(
    (jobId: string, status: JobStatus) => {
      startTransition(async () => {
        const result = await updateJobStatus(jobId, status);

        if (result.success) {
          toast.success(result.message);
          router.refresh();
          return;
        }

        toast.error(result.message);
      });
    },
    [router]
  );

  return (
    <>
      <PageHeader
        title="Việc làm"
        description="Quản lý việc làm với tìm kiếm, bộ lọc, phân trang và các thao tác CRUD trực tiếp trên dashboard."
        action={<Button className="w-full sm:w-auto" onClick={openCreateDialog}><PlusIcon data-icon="inline-start" />Tạo việc làm</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Danh sách việc làm</CardTitle>
          <CardDescription>
            Tìm kiếm theo tên công ty hoặc vị trí, lọc theo nguồn và trạng thái, sắp xếp theo ngày tạo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_180px_auto]">
            <SearchInput
              key={filters.q}
              defaultValue={filters.q}
              debounceMs={400}
              placeholder="Tìm theo công ty hoặc vị trí"
              onValueChange={(value) => {
                if (value === filters.q) {
                  return;
                }

                updateQuery({ q: value || null, page: "1" });
              }}
            />

            <Select
              items={[
                { label: "Tất cả nguồn", value: "all" },
                ...sources.map((source) => ({ label: source.name, value: source.id })),
              ]}
              value={filters.source || "all"}
              onValueChange={(value) => updateQuery({ source: value === "all" ? null : value, page: "1" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tất cả nguồn</SelectItem>
                  {sources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              items={jobTypeOptions.map((option) => ({
                label: option.label,
                value: String(option.value),
              }))}
              value={filters.jobType || ""}
              onValueChange={(value) => updateQuery({ jobType: value || null, page: "1" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Lọc theo loại công việc" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {jobTypeOptions.map((option) => (
                    <SelectItem key={String(option.value)} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              items={[
                { label: "Tất cả trạng thái", value: "all" },
                ...statusOptions,
              ]}
              value={filters.status || "all"}
              onValueChange={(value) => updateQuery({ status: value === "all" ? null : value, page: "1" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
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
                <SelectValue />
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
              onClick={() => updateQuery({ q: null, source: null, jobType: null, status: null, sort: "desc", page: null })}
            >
              Xóa bộ lọc
            </Button>
          </div>

          {jobs.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BriefcaseBusiness />
                </EmptyMedia>
                <EmptyTitle>Chưa có việc làm phù hợp</EmptyTitle>
                <EmptyDescription>
                  Hãy tạo việc làm mới hoặc điều chỉnh bộ lọc để xem thêm kết quả.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <JobTable
              jobs={jobs}
              onEdit={openEditDialog}
              onDelete={(id) => {
                const job = jobs.find((item) => item.id === id) ?? null;
                setJobToDelete(job);
              }}
              onStatusChange={handleStatusChange}
              sourceColumn
            />
          )}

          <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Trang {pagination.page}/{pagination.totalPages} · Tổng {pagination.totalCount} việc làm
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Chỉnh sửa việc làm" : "Tạo việc làm mới"}</DialogTitle>
            <DialogDescription>
              Điền đầy đủ các trường quan trọng để theo dõi việc ứng tuyển hiệu quả hơn.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="companyName">Tên công ty <span className="text-destructive">*</span></FieldLabel>
                <Input id="companyName" value={form.companyName} onChange={(e) => handleFormChange("companyName", e.target.value)} required />
                <FieldError>{errors.companyName}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="jobTitle">Vị trí <span className="text-destructive">*</span></FieldLabel>
                <Input id="jobTitle" value={form.jobTitle} onChange={(e) => handleFormChange("jobTitle", e.target.value)} required />
                <FieldError>{errors.jobTitle}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="jobUrl">Link việc làm</FieldLabel>
                <Input id="jobUrl" type="url" value={form.jobUrl} onChange={(e) => handleFormChange("jobUrl", e.target.value)} placeholder="https://..." />
              </Field>
              <Field>
                <FieldLabel htmlFor="location">Địa điểm</FieldLabel>
                <Input id="location" value={form.location} onChange={(e) => handleFormChange("location", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="salaryRange">Mức lương</FieldLabel>
                <Input id="salaryRange" value={form.salaryRange} onChange={(e) => handleFormChange("salaryRange", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="jobType">Loại công việc</FieldLabel>
                <Select items={jobTypeOptions} value={form.jobType || ""} onValueChange={(value) => handleFormChange("jobType", value ?? "")}>
                  <SelectTrigger id="jobType" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectGroup>{jobTypeOptions.map((option) => <SelectItem key={String(option.value || "empty")} value={option.value}>{option.label}</SelectItem>)}</SelectGroup></SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="sourceId">Nguồn việc làm</FieldLabel>
                <Select items={[{ label: "Chưa chọn", value: "" }, ...sources.map((source) => ({ label: source.name, value: source.id }))]} value={form.sourceId} onValueChange={(value) => handleFormChange("sourceId", value ?? "")}>
                  <SelectTrigger id="sourceId" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectGroup><SelectItem value="">Chưa chọn</SelectItem>{sources.map((source) => <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>)}</SelectGroup></SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="status">Trạng thái</FieldLabel>
                <Select items={statusOptions} value={form.status} onValueChange={(value) => handleFormChange("status", value ?? "SAVED")}>
                  <SelectTrigger id="status" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectGroup>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectGroup></SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="appliedDate">Ngày ứng tuyển</FieldLabel>
                <DatePicker id="appliedDate" value={form.appliedDate} onValueChange={(value) => handleFormChange("appliedDate", value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="deadline">Hạn chót</FieldLabel>
                <DatePicker id="deadline" value={form.deadline} onValueChange={(value) => handleFormChange("deadline", value)} />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="description">Mô tả</FieldLabel>
                <Textarea id="description" value={form.description} onChange={(e) => handleFormChange("description", e.target.value)} />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="notes">Ghi chú</FieldLabel>
                <Textarea id="notes" value={form.notes} onChange={(e) => handleFormChange("notes", e.target.value)} />
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button className="w-full sm:w-auto" type="button" variant="outline" onClick={() => handleDialogChange(false)} disabled={isPending}>Hủy</Button>
              <Button className="w-full sm:w-auto" type="submit" disabled={isPending}>{editingJob ? "Lưu thay đổi" : "Tạo việc làm"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(jobToDelete)}
        onOpenChange={(open) => {
          if (!open) setJobToDelete(null);
        }}
        title="Xóa việc làm"
        description={`Bạn có chắc muốn xóa việc làm "${jobToDelete?.jobTitle ?? ""}" không?`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}

export { JobsManager };
