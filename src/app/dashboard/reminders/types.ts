import type { ReminderType } from "@prisma/client";

type ReminderStatusFilter = "" | "open" | "completed";

type ReminderActionInput = {
  id?: string;
  title: string;
  reminderDate: string;
  type: ReminderType;
  jobApplicationId: string;
};

export type { ReminderActionInput, ReminderStatusFilter };
