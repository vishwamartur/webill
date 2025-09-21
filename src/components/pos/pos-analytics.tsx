'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Package,
  Clock,
  CreditCard,
  Receipt,
  BarChart3,
  Calendar
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface POSAnalytics {
  todaySales: {
    totalSales: number
    totalTransactions: number
    averageTransaction: number
    totalItems: number
  }
  paymentMethods: Array<{
    method: string
    count: number
    amount: number
    percentage: number
  }>
  topItems: Array<{
    item: {
      id: string
      name: string
      sku?: string
    }
    quantity: number
    revenue: number
    transactions: number
  }>
  hourlyTrends: Array<{
    hour: number
    sales: number
    transactions: number
  }>
  recentTransactions: Array<{
    id: string
    transactionNo: string
    customer: {
      name: string
    }
    totalAmount: number
    paymentMethod: string
    createdAt: string
    itemCount: number
  }>
}

interface POSAnalyticsProps {
  date?: string
}

export function POSAnalytics({ date = new Date().toISOString().split('T')[0] }: POSAnalyticsProps) {
  const [analytics, setAnalytics] = useState<POSAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(date)

  useEffect(() => {
    fetchAnalytics()
  }, [selectedDate])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/pos/analytics?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching POS analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH': return <DollarSign className="h-4 w-4" />
      case 'CARD': return <CreditCard className="h-4 w-4" />
      case 'UPI': return <Receipt className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'CASH': return 'text-green-600'
      case 'CARD': return 'text-blue-600'
      case 'UPI': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading analytics...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No analytics data available</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">POS Analytics</h2>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded px-3 py-1"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-green-500" />
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics.todaySales.totalSales)}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : formatDate(selectedDate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2 text-blue-500" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.todaySales.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(analytics.todaySales.averageTransaction)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="h-4 w-4 mr-2 text-orange-500" />
              Items Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.todaySales.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.todaySales.totalTransactions > 0 
                ? `${(analytics.todaySales.totalItems / analytics.todaySales.totalTransactions).toFixed(1)} per transaction`
                : 'No transactions'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-purple-500" />
              Avg Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(analytics.todaySales.averageTransaction)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per sale value
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.paymentMethods.map((method) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={getPaymentMethodColor(method.method)}>
                      {getPaymentMethodIcon(method.method)}
                    </div>
                    <span className="font-medium">{method.method}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(method.amount)}</div>
                    <div className="text-sm text-gray-500">
                      {method.count} transactions ({method.percentage.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topItems.slice(0, 5).map((item, index) => (
                <div key={item.item.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{item.item.name}</div>
                      {item.item.sku && (
                        <div className="text-sm text-gray-500">SKU: {item.item.sku}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(item.revenue)}</div>
                    <div className="text-sm text-gray-500">
                      {item.quantity} sold • {item.transactions} orders
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Hourly Sales Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.hourlyTrends.map((trend) => (
                <div key={trend.hour} className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {trend.hour.toString().padStart(2, '0')}:00
                  </span>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.max(5, (trend.sales / Math.max(...analytics.hourlyTrends.map(t => t.sales))) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatCurrency(trend.sales)}</div>
                    <div className="text-xs text-gray-500">{trend.transactions} sales</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{transaction.transactionNo}</div>
                    <div className="text-sm text-gray-500">
                      {transaction.customer.name} • {transaction.itemCount} items
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(transaction.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(transaction.totalAmount)}</div>
                    <div className="text-sm text-gray-500">{transaction.paymentMethod}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
