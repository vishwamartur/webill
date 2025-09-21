'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface InventoryInsightsData {
  totalItems: number
  lowStockItems: number
  outOfStockItems: number
  stockHealthPercentage: number
  topCategories: Array<{
    categoryId: string
    categoryName: string
    itemCount: number
  }>
}

interface InventoryInsightsProps {
  data: InventoryInsightsData
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function InventoryInsights({ data }: InventoryInsightsProps) {
  // Prepare stock status data
  const inStockItems = data.totalItems - data.lowStockItems - data.outOfStockItems
  const stockStatusData = [
    {
      name: 'In Stock',
      value: inStockItems,
      color: '#10b981',
      icon: CheckCircle
    },
    {
      name: 'Low Stock',
      value: data.lowStockItems,
      color: '#f59e0b',
      icon: AlertTriangle
    },
    {
      name: 'Out of Stock',
      value: data.outOfStockItems,
      color: '#ef4444',
      icon: TrendingDown
    }
  ].filter(item => item.value > 0)

  // Prepare categories data for pie chart
  const categoriesData = data.topCategories.map((category, index) => ({
    ...category,
    color: COLORS[index % COLORS.length],
    percentage: data.totalItems > 0 ? (category.itemCount / data.totalItems) * 100 : 0
  }))

  const getHealthColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-50'
    if (percentage >= 60) return 'bg-yellow-50'
    return 'bg-red-50'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Inventory Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stock Health Score */}
        <div className={`p-4 rounded-lg ${getHealthBgColor(data.stockHealthPercentage)}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Stock Health Score</div>
              <div className={`text-2xl font-bold ${getHealthColor(data.stockHealthPercentage)}`}>
                {data.stockHealthPercentage.toFixed(1)}%
              </div>
            </div>
            <Package className={`h-8 w-8 ${getHealthColor(data.stockHealthPercentage)}`} />
          </div>
        </div>

        {/* Stock Status Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Stock Status</h4>
          {stockStatusData.map((status) => {
            const Icon = status.icon
            const percentage = data.totalItems > 0 ? (status.value / data.totalItems) * 100 : 0
            
            return (
              <div key={status.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5" style={{ color: status.color }} />
                  <div>
                    <div className="font-medium">{status.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {percentage.toFixed(1)}% of total inventory
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{status.value}</div>
                  <div className="text-sm text-muted-foreground">items</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Top Categories */}
        {categoriesData.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Top Categories</h4>
            
            {/* Mini Pie Chart */}
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="itemCount"
                  >
                    {categoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} items`, 'Count']}
                    labelFormatter={(label) => `Category: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category List */}
            <div className="space-y-2">
              {categoriesData.slice(0, 5).map((category, index) => (
                <div key={category.categoryId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-sm font-medium">{category.categoryName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{category.itemCount}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({category.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{data.totalItems}</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{categoriesData.length}</div>
            <div className="text-xs text-muted-foreground">Categories</div>
          </div>
        </div>

        {/* Alerts */}
        {(data.outOfStockItems > 0 || data.lowStockItems > 5) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Inventory Alerts</span>
            </div>
            <div className="mt-2 text-sm text-red-700">
              {data.outOfStockItems > 0 && (
                <div>• {data.outOfStockItems} items are out of stock</div>
              )}
              {data.lowStockItems > 5 && (
                <div>• {data.lowStockItems} items are running low</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
