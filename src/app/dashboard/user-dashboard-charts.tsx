"use client";

import * as React from "react";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ChartDatum = {
  name: string;
  value: number;
};

interface UserDashboardChartsProps {
  statusData: ChartDatum[];
  sourceData: ChartDatum[];
  statusDescription?: string;
  sourceDescription?: string;
  emptyStatusDescription?: string;
  emptySourceDescription?: string;
}

const STATUS_COLORS = ["#2563eb", "#14b8a6", "#f59e0b", "#22c55e", "#ef4444", "#64748b"];
const SOURCE_COLORS = ["#2563eb", "#8b5cf6", "#14b8a6", "#f59e0b", "#f97316", "#64748b"];

function EmptyChartState({ description }: { description: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-border px-6 text-center text-sm text-muted-foreground">
      {description}
    </div>
  );
}

function DashboardPieChart({ data, colors }: { data: ChartDatum[]; colors: string[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={92}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value ?? 0, "Số lượng"]} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function UserDashboardCharts({
  statusData,
  sourceData,
  statusDescription = "Phân bổ số lượng job theo từng trạng thái hiện tại.",
  sourceDescription = "Phân bổ số lượng job theo nguồn mà bạn đang theo dõi.",
  emptyStatusDescription = "Chưa có dữ liệu việc làm để hiển thị biểu đồ trạng thái.",
  emptySourceDescription = "Chưa có dữ liệu nguồn việc làm để hiển thị biểu đồ.",
}: UserDashboardChartsProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Trạng thái ứng tuyển</CardTitle>
          <CardDescription>{statusDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {statusData.length === 0 ? (
            <EmptyChartState description={emptyStatusDescription} />
          ) : (
            <DashboardPieChart data={statusData} colors={STATUS_COLORS} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nguồn việc làm</CardTitle>
          <CardDescription>{sourceDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {sourceData.length === 0 ? (
            <EmptyChartState description={emptySourceDescription} />
          ) : (
            <DashboardPieChart data={sourceData} colors={SOURCE_COLORS} />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export { UserDashboardCharts };
