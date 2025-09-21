'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface RevenueData {
  daily: Array<{
    date: string
    sales: number
    otherIncome: number
    totalRevenue: number
    salesCount: number
  }>
  monthly: Array<{
    month: string
    monthName: string
    sales: number
    otherIncome: number
    totalRevenue: number
    salesCount: number
  }>
}

interface RevenueChartProps {
  data: RevenueData
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, 'MMM dd')
    } catch {
      return dateString
    }
  }

  // Use daily data if available, otherwise use monthly
  const chartData = data.daily.length > 0 ? data.daily : data.monthly
  const isDaily = data.daily.length > 0

  // Prepare chart data
  const formattedData = chartData.map(item => ({
    ...item,
    displayDate: isDaily ? formatDate(item.date || item.month) : item.monthName || item.month,
  }))

  // Calculate totals for summary
  const totalRevenue = chartData.reduce((sum, item) => sum + item.totalRevenue, 0)
  const totalSales = chartData.reduce((sum, item) => sum + item.sales, 0)
  const totalOtherIncome = chartData.reduce((sum, item) => sum + item.otherIncome, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Revenue Trends
        </CardTitle>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>Sales: {formatCurrency(totalSales)}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Other Income: {formatCurrency(totalOtherIncome)}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span>Total: {formatCurrency(totalRevenue)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {isDaily ? (
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Sales"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="otherIncome" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Other Income"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalRevenue" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  name="Total Revenue"
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                />
              </LineChart>
            ) : (
              <BarChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar dataKey="sales" fill="#3b82f6" name="Sales" />
                <Bar dataKey="otherIncome" fill="#10b981" name="Other Income" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalSales)}
            </div>
            <div className="text-sm text-muted-foreground">Total Sales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalOtherIncome)}
            </div>
            <div className="text-sm text-muted-foreground">Other Income</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
