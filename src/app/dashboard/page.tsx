import { BarChart3, Bell, BriefcaseBusiness, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCurrentAccount } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { UserDashboardCharts } from "./user-dashboard-charts";

const statusLabels: Record<string, string> = {
  SAVED: "Đã lưu",
  APPLIED: "Đã nộp",
  INTERVIEWING: "Phỏng vấn",
  OFFER: "Nhận offer",
  REJECTED: "Từ chối",
  ARCHIVED: "Lưu trữ",
};

function buildSourceData(jobs: Array<{ source: { name: string } | null }>) {
  const sourceCounter = jobs.reduce<Map<string, number>>((accumulator, job) => {
    const key = job.source?.name ?? "Khác";
    accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
    return accumulator;
  }, new Map());

  return Array.from(sourceCounter.entries()).map(([name, value]) => ({ name, value }));
}

export default async function DashboardPage() {
  const { profile } = await requireCurrentAccount();

  if (profile.role === "ADMIN") {
    const [userCount, jobCount, activeSourceCount, pendingReminderCount, statusGroups, jobsWithSource] = await Promise.all([
      prisma.profile.count(),
      prisma.jobApplication.count(),
      prisma.jobSource.count({ where: { isActive: true } }),
      prisma.reminder.count({ where: { isCompleted: false } }),
      prisma.jobApplication.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.jobApplication.findMany({
        select: {
          source: {
            select: { name: true },
          },
        },
      }),
    ]);

    const statusData = statusGroups.map((group) => ({
      name: statusLabels[group.status] ?? group.status,
      value: group._count.status,
    }));

    const sourceData = buildSourceData(jobsWithSource);

    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Tổng quan quản trị"
          description="Theo dõi nhanh người dùng, việc làm và tình trạng dữ liệu hệ thống."
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Người dùng" value={userCount} description="Tổng tài khoản đã tạo" icon={<Users />} />
          <StatCard title="Việc làm" value={jobCount} description="Tổng bản ghi việc làm" icon={<BriefcaseBusiness />} />
          <StatCard title="Nguồn việc làm" value={activeSourceCount} description="Nguồn đang hoạt động" icon={<BarChart3 />} />
          <StatCard title="Nhắc nhở mở" value={pendingReminderCount} description="Chưa hoàn thành" icon={<Bell />} />
        </section>

        <UserDashboardCharts
          statusData={statusData}
          sourceData={sourceData}
          statusDescription="Phân bổ trạng thái của toàn bộ job trong hệ thống."
          sourceDescription="Phân bổ nguồn việc làm trên toàn bộ dữ liệu của tất cả user."
          emptyStatusDescription="Chưa có dữ liệu việc làm để hiển thị biểu đồ trạng thái hệ thống."
          emptySourceDescription="Chưa có dữ liệu nguồn việc làm để hiển thị biểu đồ hệ thống."
        />
      </div>
    );
  }

  const [statusGroups, userJobs] = await Promise.all([
    prisma.jobApplication.groupBy({
      by: ["status"],
      where: { userId: profile.id },
      _count: { status: true },
    }),
    prisma.jobApplication.findMany({
      where: { userId: profile.id },
      select: {
        source: {
          select: { name: true },
        },
      },
    }),
  ]);

  const statusData = statusGroups.map((group) => ({
    name: statusLabels[group.status] ?? group.status,
    value: group._count.status,
  }));
  const sourceData = buildSourceData(userJobs);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Tổng quan"
        description="Theo dõi phân bổ trạng thái ứng tuyển và nguồn việc làm của bạn."
      />

      <UserDashboardCharts statusData={statusData} sourceData={sourceData} />
    </div>
  );
}
