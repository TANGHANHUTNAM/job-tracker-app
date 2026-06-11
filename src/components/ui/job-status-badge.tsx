import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const jobStatusVariants = cva(
  "border-transparent font-medium",
  {
    variants: {
      status: {
        SAVED: "bg-secondary text-secondary-foreground",
        APPLIED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        INTERVIEWING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        OFFER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        REJECTED: "bg-destructive/10 text-destructive",
        ARCHIVED: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "SAVED",
    },
  }
)

const jobStatusLabels: Record<string, string> = {
  SAVED: "Đã lưu",
  APPLIED: "Đã ứng tuyển",
  INTERVIEWING: "Phỏng vấn",
  OFFER: "Nhận offer",
  REJECTED: "Từ chối",
  ARCHIVED: "Lưu trữ",
}

type JobStatus = "SAVED" | "APPLIED" | "INTERVIEWING" | "OFFER" | "REJECTED" | "ARCHIVED"

interface JobStatusBadgeProps extends VariantProps<typeof jobStatusVariants> {
  status: JobStatus
  className?: string
}

function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  return (
    <Badge className={cn(jobStatusVariants({ status }), className)}>
      {jobStatusLabels[status] ?? status}
    </Badge>
  )
}

export { JobStatusBadge, jobStatusVariants, jobStatusLabels }
export type { JobStatus }
