import type { JobStatus, JobType } from "@prisma/client";

type JobActionInput = {
  id?: string;
  companyName: string;
  jobTitle: string;
  jobUrl?: string;
  location?: string;
  salaryRange?: string;
  jobType?: JobType | "";
  sourceId?: string;
  status: JobStatus;
  appliedDate?: string;
  deadline?: string;
  description?: string;
  notes?: string;
};

type JobActionResult = {
  success: boolean;
  message: string;
};

export type { JobActionInput, JobActionResult };
