type JobSourceActionInput = {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
};

type JobSourceActionResult = {
  success: boolean;
  message: string;
};

export type { JobSourceActionInput, JobSourceActionResult };
