import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { JobSourceManager } from "./job-source-manager";

export default async function JobSourcesPage() {
  await requireRole("ADMIN");

  const sources = await prisma.jobSource.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Nguồn việc làm"
        description="Quản trị danh mục nguồn việc làm với đầy đủ thao tác tạo, cập nhật và xóa."
      />

      <JobSourceManager sources={sources} />
    </div>
  );
}
