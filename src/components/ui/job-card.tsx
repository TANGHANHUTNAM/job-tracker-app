"use client"

import * as React from "react"
import {
  MoreHorizontalIcon,
  ExternalLinkIcon,
  CalendarIcon,
  MapPinIcon,
  BriefcaseIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { JobStatusBadge, type JobStatus } from "@/components/ui/job-status-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface JobCardProps {
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
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onStatusChange?: (id: string, status: JobStatus) => void
  className?: string
}

function formatJobType(jobType?: string | null): string {
  if (!jobType) return ""
  return jobType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ""
  const d = new Date(date)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function JobCard({
  id,
  companyName,
  jobTitle,
  jobUrl,
  location,
  salaryRange,
  jobType,
  status,
  appliedDate,
  createdAt,
  onEdit,
  onDelete,
  onStatusChange,
  className,
}: JobCardProps) {
  return (
    <Card className={cn("group/card gap-0 p-0", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 p-4 pb-2">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate font-medium leading-none">{companyName}</h3>
          <p className="truncate text-sm text-muted-foreground">{jobTitle}</p>
        </div>
        <div className="flex items-center gap-1">
          <JobStatusBadge status={status} />
          {(onEdit || onDelete || onStatusChange) && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover/card:opacity-100" />}>
                <MoreHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(id)}>
                    Edit
                  </DropdownMenuItem>
                )}
                {jobUrl && (
                  <DropdownMenuItem
                    render={
                      <a href={jobUrl} target="_blank" rel="noopener noreferrer">
                        Open link <ExternalLinkIcon className="ml-auto size-3.5" />
                      </a>
                    }
                  />
                )}
                {onStatusChange && (
                  <>
                    <DropdownMenuSeparator />
                    {(["SAVED", "APPLIED", "INTERVIEWING", "OFFER", "REJECTED", "ARCHIVED"] as JobStatus[])
                      .filter((s) => s !== status)
                      .map((s) => (
                        <DropdownMenuItem key={s} onClick={() => onStatusChange(id, s)}>
                          Move to {s.charAt(0) + s.slice(1).toLowerCase()}
                        </DropdownMenuItem>
                      ))}
                  </>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(id)}
                      className="text-destructive focus:text-destructive"
                    >
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {jobType && (
            <span className="flex items-center gap-1">
              <BriefcaseIcon className="size-3" />
              {formatJobType(jobType)}
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="size-3" />
              {location}
            </span>
          )}
          {salaryRange && (
            <span className="flex items-center gap-1 font-medium text-foreground">
              {salaryRange}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarIcon className="size-3" />
            {appliedDate ? `Ứng tuyển ${formatDate(appliedDate)}` : `Đã thêm ${formatDate(createdAt)}`}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export { JobCard }
export type { JobCardProps }
