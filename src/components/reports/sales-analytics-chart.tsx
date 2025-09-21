'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { BarChart3, Clock, CreditCard } from 'lucide-react'

interface SalesAnalyticsData {
  paymentMethods: Array<{
    method: string
    amount: number
    count: number
  }>
  topSellingItems: Array<{
    itemId: string
    itemName: string
    sku: string
    quantitySold: number
    revenue: number
    salesCount: number
    avgPrice: number
  }>
  hourlyPattern: Array<{
    hour: number
    transactions: number
    amount: number
  }>
}

interface SalesAnalyticsChartProps {
  data: SalesAnalyticsData
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function SalesAnalyticsChart({ data }: SalesAnalyticsChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}${period}`
  }

  // Prepare payment methods data for pie chart
  const paymentMethodsData = data.paymentMethods.map((method, index) => ({
    ...method,
    color: COLORS[index % COLORS.length],
    percentage: data.paymentMethods.length > 0 
      ? (method.amount / data.paymentMethods.reduce((sum, m) => sum + m.amount, 0)) * 100 
      : 0
  }))

  // Filter hourly data to show only hours with activity
  const activeHours = data.hourlyPattern.filter(hour => hour.transactions > 0 || hour.amount > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Sales Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="payment-methods" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="top-items">Top Items</TabsTrigger>
            <TabsTrigger value="hourly-pattern">Hourly Pattern</TabsTrigger>
          </TabsList>

          <TabsContent value="payment-methods" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ method, percentage }) => `${method} (${percentage.toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {paymentMethodsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentMethodsData.map((method, index) => (
                <div key={method.method} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: method.color }}
                  ></div>
                  <div className="flex-1">
                    <div className="font-medium">{method.method}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(method.amount)} • {method.count} transactions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="top-items" className="space-y-4">
            <div className="space-y-3">
              {data.topSellingItems.slice(0, 8).map((item, index) => (
                <div key={item.itemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{item.itemName}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.sku && `SKU: ${item.sku} • `}
                        {item.quantitySold} units sold
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(item.revenue)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(item.avgPrice)} avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="hourly-pattern" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={formatHour}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatCurrency}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'amount' ? formatCurrency(value) : value,
                      name === 'amount' ? 'Sales Amount' : 'Transactions'
                    ]}
                    labelFormatter={(hour: number) => `Time: ${formatHour(hour)}`}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="amount" 
                    fill="#3b82f6" 
                    name="amount"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="transactions" 
                    fill="#10b981" 
                    name="transactions"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-sm text-muted-foreground">Peak Sales Hour</div>
                <div className="text-lg font-bold text-blue-600">
                  {activeHours.length > 0 
                    ? formatHour(activeHours.reduce((max, hour) => hour.amount > max.amount ? hour : max, activeHours[0]).hour)
                    : 'N/A'
                  }
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <BarChart3 className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-sm text-muted-foreground">Peak Transaction Hour</div>
                <div className="text-lg font-bold text-green-600">
                  {activeHours.length > 0 
                    ? formatHour(activeHours.reduce((max, hour) => hour.transactions > max.transactions ? hour : max, activeHours[0]).hour)
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
