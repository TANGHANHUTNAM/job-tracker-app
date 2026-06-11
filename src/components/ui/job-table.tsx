"use client"

import * as React from "react"
import {
  ArrowUpDownIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  Trash2Icon,
  PencilIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  JobStatusBadge,
  jobStatusLabels,
  type JobStatus,
} from "@/components/ui/job-status-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface JobRow {
  id: string
  companyName: string
  jobTitle: string
  jobUrl?: string | null
  location?: string | null
  salaryRange?: string | null
  jobType?: string | null
  status: JobStatus
  appliedDate?: Date | null
  createdAt: Date
  sourceName?: string | null
}

interface JobTableProps {
  jobs: JobRow[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onStatusChange?: (id: string, status: JobStatus) => void
  onSort?: (field: string, direction: "asc" | "desc") => void
  sortField?: string
  sortDirection?: "asc" | "desc"
  sourceColumn?: boolean
  className?: string
}

const jobTypeLabels: Record<string, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  INTERNSHIP: "Thực tập",
  CONTRACT: "Hợp đồng",
  FREELANCE: "Freelance",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "Onsite",
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function SortableHeader({
  field,
  label,
  currentField,
  currentDirection,
  onSort,
}: {
  field: string
  label: string
  currentField?: string
  currentDirection?: "asc" | "desc"
  onSort?: (field: string, direction: "asc" | "desc") => void
}) {
  const isActive = currentField === field
  const direction = isActive ? currentDirection : "asc"

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 data-[state=open]:bg-accent"
      onClick={() => onSort?.(field, direction === "asc" ? "desc" : "asc")}
    >
      <span>{label}</span>
      <ArrowUpDownIcon className="ml-1 size-3.5" />
      {isActive && direction === "desc" && (
        <ChevronDownIcon className="ml-0.5 size-3" />
      )}
    </Button>
  )
}

function JobTable({
  jobs,
  onEdit,
  onDelete,
  onStatusChange,
  onSort,
  sortField,
  sortDirection,
  sourceColumn = false,
  className,
}: JobTableProps) {
  return (
    <div className={cn("rounded-xl border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">
              <SortableHeader
                field="companyName"
                label="Công ty"
                currentField={sortField}
                currentDirection={sortDirection}
                onSort={onSort}
              />
            </TableHead>
            <TableHead>
              <SortableHeader
                field="jobTitle"
                label="Vị trí"
                currentField={sortField}
                currentDirection={sortDirection}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="w-[160px]">Loại công việc</TableHead>
            {sourceColumn && <TableHead className="w-[140px]">Nguồn</TableHead>}
            <TableHead className="w-[120px]">
              <SortableHeader
                field="status"
                label="Trạng thái"
                currentField={sortField}
                currentDirection={sortDirection}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="w-[120px]">
              <SortableHeader
                field="createdAt"
                label="Ngày tạo"
                currentField={sortField}
                currentDirection={sortDirection}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={sourceColumn ? 7 : 6} className="h-24 text-center text-muted-foreground">
                Không tìm thấy việc làm phù hợp.
              </TableCell>
            </TableRow>
          ) : (
            jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{job.companyName}</span>
                    {job.jobUrl && (
                      <a
                        href={job.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLinkIcon className="size-3" />
                      </a>
                    )}
                  </div>
                  {job.location && (
                    <p className="text-xs text-muted-foreground">{job.location}</p>
                  )}
                </TableCell>
                <TableCell>
                  <span className="truncate">{job.jobTitle}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {job.jobType ? jobTypeLabels[job.jobType] ?? job.jobType : "Chưa chọn"}
                </TableCell>
                {sourceColumn && (
                  <TableCell className="text-muted-foreground">
                    {job.sourceName ?? "Chưa có"}
                  </TableCell>
                )}
                <TableCell>
                  <JobStatusBadge status={job.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(job.appliedDate || job.createdAt)}
                </TableCell>
                <TableCell>
                  {(onEdit || onDelete || onStatusChange) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-7" />}>
                        <MoreHorizontalIcon className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(job.id)}>
                            <PencilIcon className="mr-2 size-3.5" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                        )}
                        {onStatusChange && (
                          <>
                            <DropdownMenuSeparator />
                            {(["SAVED", "APPLIED", "INTERVIEWING", "OFFER", "REJECTED", "ARCHIVED"] as JobStatus[])
                              .filter((s) => s !== job.status)
                              .slice(0, 4)
                              .map((s) => (
                                <DropdownMenuItem key={s} onClick={() => onStatusChange(job.id, s)}>
                                  Chuyển sang {jobStatusLabels[s] ?? s}
                                </DropdownMenuItem>
                              ))
                            }
                          </>
                        )}
                        {onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(job.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2Icon className="mr-2 size-3.5" />
                              Xóa
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export { JobTable }
export type { JobTableProps, JobRow }
