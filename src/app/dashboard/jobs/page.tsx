import { type JobStatus, type JobType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentAccount } from "@/lib/auth/session";
import { JobsManager } from "./jobs-manager";

const PAGE_SIZE = 10;

function isJobStatus(value?: string): value is JobStatus {
  return ["SAVED", "APPLIED", "INTERVIEWING", "OFFER", "REJECTED", "ARCHIVED"].includes(value ?? "");
}

function isJobType(value?: string): value is JobType {
  return ["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT", "FREELANCE", "REMOTE", "HYBRID", "ONSITE"].includes(value ?? "");
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile } = await requireCurrentAccount();
  const isAdmin = profile.role === "ADMIN";
  const params = (await searchParams) ?? {};

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const source = typeof params.source === "string" ? params.source : "";
  const jobType = typeof params.jobType === "string" && isJobType(params.jobType) ? params.jobType : "";
  const status = typeof params.status === "string" && isJobStatus(params.status) ? params.status : "";
  const sort = typeof params.sort === "string" && params.sort === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);

  const where = {
    ...(isAdmin ? {} : { userId: profile.id }),
    ...(q
      ? {
          OR: [
            { companyName: { contains: q, mode: "insensitive" as const } },
            { jobTitle: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(source ? { sourceId: source } : {}),
    ...(jobType ? { jobType } : {}),
    ...(status ? { status } : {}),
  };

  const [sources, totalCount, jobs] = await Promise.all([
    prisma.jobSource.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.jobApplication.count({ where }),
    prisma.jobApplication.findMany({
      where,
      include: {
        source: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: sort },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-8">
      <JobsManager
        jobs={jobs.map((job) => ({
          id: job.id,
          companyName: job.companyName,
          jobTitle: job.jobTitle,
          jobUrl: job.jobUrl,
          location: job.location,
          salaryRange: job.salaryRange,
          jobType: job.jobType,
          status: job.status,
          appliedDate: job.appliedDate,
          createdAt: job.createdAt,
          sourceId: job.sourceId,
          sourceName: job.source?.name ?? null,
          deadline: job.deadline,
          description: job.description,
          notes: job.notes,
        }))}
        sources={sources}
        pagination={{ page, pageSize: PAGE_SIZE, totalCount, totalPages }}
        filters={{ q, source, jobType, status, sort }}
      />
    </div>
  );
}
