'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface InvoiceAnalytics {
  summary: {
    totalInvoices: number
    totalRevenue: number
    paidRevenue: number
    outstandingRevenue: number
    averageInvoiceValue: number
    collectionEfficiency: number
    avgDaysToPayment: number
  }
  statusBreakdown: Array<{
    status: string
    count: number
    totalAmount: number
    outstandingAmount: number
  }>
  overdueInvoices: Array<{
    id: string
    invoiceNo: string
    customer: { name: string }
    dueDate: string
    balanceAmount: number
    daysOverdue: number
  }>
  topCustomers: Array<{
    customer: { id: string; name: string; email?: string }
    totalInvoices: number
    totalRevenue: number
    paidRevenue: number
    outstandingRevenue: number
  }>
  agingReport: Array<{
    range: string
    count: number
    amount: number
  }>
}

interface InvoiceAnalyticsProps {
  period?: number
  customerId?: string
}

export function InvoiceAnalytics({ period = 30, customerId }: InvoiceAnalyticsProps) {
  const [analytics, setAnalytics] = useState<InvoiceAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(period)

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPeriod, customerId])

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams({
        period: selectedPeriod.toString(),
      })
      
      if (customerId) {
        params.append('customerId', customerId)
      }

      const response = await fetch(`/api/invoices/analytics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching invoice analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-600'
      case 'SENT': return 'text-blue-600'
      case 'DRAFT': return 'text-gray-600'
      case 'OVERDUE': return 'text-red-600'
      case 'CANCELLED': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle className="h-4 w-4" />
      case 'SENT': return <Clock className="h-4 w-4" />
      case 'DRAFT': return <FileText className="h-4 w-4" />
      case 'OVERDUE': return <AlertTriangle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
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
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoice Analytics</h2>
        <div className="flex space-x-2">
          {[7, 30, 90, 365].map((days) => (
            <Button
              key={days}
              variant={selectedPeriod === days ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(days)}
            >
              {days === 7 ? '7 Days' : days === 30 ? '30 Days' : days === 90 ? '3 Months' : '1 Year'}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Total Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(analytics.summary.averageInvoiceValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Last {selectedPeriod} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
              Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics.summary.paidRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.summary.collectionEfficiency.toFixed(1)}% efficiency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-orange-500" />
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(analytics.summary.outstandingRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg {analytics.summary.avgDaysToPayment.toFixed(1)} days to pay
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Invoice Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.statusBreakdown.map((status) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={getStatusColor(status.status)}>
                      {getStatusIcon(status.status)}
                    </div>
                    <span className="font-medium">{status.status}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{status.count} invoices</div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(status.totalAmount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Aging Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Accounts Receivable Aging
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.agingReport.map((range) => (
                <div key={range.range} className="flex items-center justify-between">
                  <span className="font-medium">{range.range}</span>
                  <div className="text-right">
                    <div className="font-semibold">{range.count} invoices</div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(range.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topCustomers.slice(0, 5).map((customer, index) => (
                <div key={customer.customer.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{customer.customer.name}</div>
                    <div className="text-sm text-gray-500">
                      {customer.totalInvoices} invoices
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(customer.totalRevenue)}
                    </div>
                    {customer.outstandingRevenue > 0 && (
                      <div className="text-sm text-orange-600">
                        {formatCurrency(customer.outstandingRevenue)} outstanding
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overdue Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Overdue Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.overdueInvoices.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No overdue invoices
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.overdueInvoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{invoice.invoiceNo}</div>
                      <div className="text-sm text-gray-500">
                        {invoice.customer.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">
                        {formatCurrency(invoice.balanceAmount)}
                      </div>
                      <div className="text-sm text-red-500">
                        {invoice.daysOverdue} days overdue
                      </div>
                    </div>
                  </div>
                ))}
                {analytics.overdueInvoices.length > 5 && (
                  <div className="text-center text-sm text-gray-500">
                    +{analytics.overdueInvoices.length - 5} more overdue invoices
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
