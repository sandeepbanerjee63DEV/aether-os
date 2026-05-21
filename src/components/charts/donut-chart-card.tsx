"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

interface DonutChartCardProps {
  title: string;
  data: { name: string; value: number; fill: string }[];
  centerLabel?: string;
  centerValue?: string;
  emptyMessage?: string;
}

export function DonutChartCard({ title, data, centerLabel, centerValue, emptyMessage }: DonutChartCardProps) {
  const hasData = data.some((d) => d.value > 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState title="No data" description={emptyMessage || "Data will appear as leads are added."} />
        ) : (
          <>
            <div className="relative h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value">
                    {data.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              {(centerLabel || centerValue) && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  {centerValue && <p className="text-lg font-bold text-slate-900">{centerValue}</p>}
                  {centerLabel && <p className="text-[10px] text-slate-500">{centerLabel}</p>}
                </div>
              )}
            </div>
            <ul className="mt-3 space-y-1.5">
              {data.map((d) => (
                <li key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                    {d.name}
                  </span>
                  <span className="font-semibold text-slate-800">{d.value}%</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
