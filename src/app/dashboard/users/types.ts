import type { AppRole } from "@prisma/client";

type UserRoleFilter = "" | AppRole;
type UserStatusFilter = "" | "active" | "inactive";

type CreateUserInput = {
  fullName: string;
  email: string;
  password: string;
  role: AppRole;
};

type UpdateUserInput = {
  id: string;
  fullName: string;
  role: AppRole;
};

type ToggleUserStatusInput = {
  id: string;
  nextBlockedState: boolean;
};

export type {
  CreateUserInput,
  ToggleUserStatusInput,
  UpdateUserInput,
  UserRoleFilter,
  UserStatusFilter,
};
