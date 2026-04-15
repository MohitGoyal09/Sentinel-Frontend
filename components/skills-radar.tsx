"use client";

import { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SkillsData {
  technical: number;
  communication: number;
  leadership: number;
  collaboration: number;
  adaptability: number;
  creativity: number;
  updated_at?: string;
}

interface SkillsRadarProps {
  data: SkillsData | null;
  className?: string;
  height?: number;
}

const SKILL_LABELS: Record<string, string> = {
  technical: "Technical",
  communication: "Communication",
  leadership: "Leadership",
  collaboration: "Collaboration",
  adaptability: "Adaptability",
  creativity: "Creativity",
};

export function SkillsRadar({ data, className, height = 300 }: SkillsRadarProps) {
  const chartData = useMemo(() => {
    if (!data) return [];

    return [
      { skill: "Technical", value: data.technical, fullMark: 100 },
      { skill: "Communication", value: data.communication, fullMark: 100 },
      { skill: "Leadership", value: data.leadership, fullMark: 100 },
      { skill: "Collaboration", value: data.collaboration, fullMark: 100 },
      { skill: "Adaptability", value: data.adaptability, fullMark: 100 },
      { skill: "Creativity", value: data.creativity, fullMark: 100 },
    ];
  }, [data]);

  if (!data) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border bg-muted/50 ${className}`}
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">No skills data available</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className ?? ""}`}>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            tickCount={6}
            axisLine={false}
          />
          <Radar
            name="Skills"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <p className="font-medium">{data.skill}</p>
                    <p className="text-sm text-muted-foreground">
                      Score: {data.value}/100
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SkillsRadar;
