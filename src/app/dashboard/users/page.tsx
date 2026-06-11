import { type AppRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { UsersManager } from "./users-manager";
import type { UserRoleFilter, UserStatusFilter } from "./types";

const PAGE_SIZE = 10;

function isRole(value?: string): value is AppRole {
  return value === "ADMIN" || value === "USER";
}

function isStatus(value?: string): value is Exclude<UserStatusFilter, ""> {
  return value === "active" || value === "inactive";
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("ADMIN");
  const params = (await searchParams) ?? {};

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const role: UserRoleFilter = typeof params.role === "string" && isRole(params.role) ? params.role : "";
  const status: UserStatusFilter =
    typeof params.status === "string" && isStatus(params.status) ? params.status : "";
  const sort = typeof params.sort === "string" && params.sort === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);

  const where: Prisma.ProfileWhereInput = {
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(role ? { role } : {}),
    ...(status ? { isBlocked: status === "inactive" } : {}),
  };

  const [totalCount, users] = await Promise.all([
    prisma.profile.count({ where }),
    prisma.profile.findMany({
      where,
      orderBy: { createdAt: sort },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <UsersManager
      users={users}
      filters={{ q, role, status, sort }}
      pagination={{ page, pageSize: PAGE_SIZE, totalCount, totalPages }}
    />
  );
}
