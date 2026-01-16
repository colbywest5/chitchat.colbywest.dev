'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'

interface AgentData {
  name: string
  tasksCompleted: number
  avgDuration: number
  successRate: number
}

interface AgentPerformanceChartProps {
  data: AgentData[]
  height?: number
}

export function AgentPerformanceChart({ data, height = 250 }: AgentPerformanceChartProps) {
  const getBarColor = (successRate: number) => {
    if (successRate >= 90) return '#22c55e'
    if (successRate >= 70) return '#eab308'
    return '#ef4444'
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-200">Agent Performance</h3>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-success-500" />
            <span className="text-gray-500">≥90%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-warning-500" />
            <span className="text-gray-500">70-89%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-error-500" />
            <span className="text-gray-500">&lt;70%</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ color: '#9ca3af', marginBottom: 4 }}
            formatter={(value: number, name: string) => {
              if (name === 'tasksCompleted') return [value, 'Tasks']
              if (name === 'successRate') return [`${value}%`, 'Success Rate']
              return [value, name]
            }}
          />
          <Bar dataKey="tasksCompleted" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.successRate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
