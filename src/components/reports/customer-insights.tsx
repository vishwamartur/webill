'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserPlus, AlertCircle, Star } from 'lucide-react'

interface CustomerInsightsData {
  totalCustomers: number
  newCustomers: number
  customersWithOutstanding: number
  topCustomers: Array<{
    customerId: string
    customerName: string
    revenue: number
    transactionCount: number
  }>
}

interface CustomerInsightsProps {
  data: CustomerInsightsData
}

export function CustomerInsights({ data }: CustomerInsightsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const outstandingPercentage = data.totalCustomers > 0 
    ? (data.customersWithOutstanding / data.totalCustomers) * 100 
    : 0

  const newCustomerPercentage = data.totalCustomers > 0 
    ? (data.newCustomers / data.totalCustomers) * 100 
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Customer Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{data.totalCustomers}</div>
            <div className="text-sm text-muted-foreground">Total Customers</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <UserPlus className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{data.newCustomers}</div>
            <div className="text-sm text-muted-foreground">New Customers</div>
            {newCustomerPercentage > 0 && (
              <div className="text-xs text-green-600 mt-1">
                {newCustomerPercentage.toFixed(1)}% of total
              </div>
            )}
          </div>
        </div>

        {/* Outstanding Alert */}
        {data.customersWithOutstanding > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Outstanding Invoices</span>
            </div>
            <div className="mt-1 text-sm text-yellow-700">
              {data.customersWithOutstanding} customers have outstanding invoices
              {outstandingPercentage > 0 && (
                <span className="ml-1">({outstandingPercentage.toFixed(1)}% of customers)</span>
              )}
            </div>
          </div>
        )}

        {/* Top Customers */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 flex items-center">
            <Star className="h-4 w-4 mr-1" />
            Top Customers
          </h4>
          
          {data.topCustomers.length > 0 ? (
            <div className="space-y-3">
              {data.topCustomers.map((customer, index) => (
                <div key={customer.customerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{customer.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {customer.transactionCount} transactions
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">{formatCurrency(customer.revenue)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(customer.revenue / Math.max(customer.transactionCount, 1))} avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">No customer data available for this period</div>
            </div>
          )}
        </div>

        {/* Customer Health Metrics */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {data.totalCustomers - data.customersWithOutstanding}
              </div>
              <div className="text-xs text-muted-foreground">Customers in Good Standing</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {data.topCustomers.reduce((sum, customer) => sum + customer.transactionCount, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Transactions</div>
            </div>
          </div>
        </div>

        {/* Growth Indicator */}
        {data.newCustomers > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Customer Growth</span>
            </div>
            <div className="mt-1 text-sm text-green-700">
              {data.newCustomers} new customers acquired this period
              {newCustomerPercentage >= 10 && (
                <span className="ml-1 font-medium">- Strong growth! 🎉</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
