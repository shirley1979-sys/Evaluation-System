'use client'

import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { CategoryScore } from '@/types'

export default function RadarChart({ data }: { data: CategoryScore[] }) {
  const chartData = data.map((d) => ({ subject: d.category, value: d.avg }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsRadar data={chartData} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#DDE3EE" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 11, fill: '#4A5568' }}
        />
        <Radar
          name="점수"
          dataKey="value"
          stroke="#2563EB"
          fill="#2563EB"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(v: number) => [v.toFixed(1), '점수']}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  )
}
