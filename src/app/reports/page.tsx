'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  FileText,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns'
import { RevenueChart } from '@/components/reports/revenue-chart'
import { SalesAnalyticsChart } from '@/components/reports/sales-analytics-chart'
import { InventoryInsights } from '@/components/reports/inventory-insights'
import { CustomerInsights } from '@/components/reports/customer-insights'
import { FinancialReports } from '@/components/reports/financial-reports'
import { SalesReports } from '@/components/reports/sales-reports'
import { InventoryReports } from '@/components/reports/inventory-reports'
import { TaxReports } from '@/components/reports/tax-reports'
import { PartiesReports } from '@/components/reports/parties-reports'

interface DashboardData {
  period: {
    from: string
    to: string
  }
  kpis: {
    totalRevenue: { value: number; growth: number; trend: string }
    totalSales: { value: number; count: number; growth: number; trend: string }
    grossProfit: { value: number; margin: number; trend: string }
    outstandingInvoices: { value: number; count: number; trend: string }
    inventoryValue: { value: number; items: number; trend: string }
    activeCustomers: { count: number; trend: string }
    activeSuppliers: { count: number; trend: string }
    totalExpenses: { value: number; count: number }
  }
  revenueTrends: {
    daily: Array<{ date: string; sales: number; otherIncome: number; totalRevenue: number; salesCount: number }>
    monthly: Array<{ month: string; monthName: string; sales: number; otherIncome: number; totalRevenue: number; salesCount: number }>
  }
  salesAnalytics: {
    paymentMethods: Array<{ method: string; amount: number; count: number }>
    topSellingItems: Array<{ itemId: string; itemName: string; sku: string; quantitySold: number; revenue: number; salesCount: number; avgPrice: number }>
    hourlyPattern: Array<{ hour: number; transactions: number; amount: number }>
  }
  inventoryInsights: {
    totalItems: number
    lowStockItems: number
    outOfStockItems: number
    stockHealthPercentage: number
    topCategories: Array<{ categoryId: string; categoryName: string; itemCount: number }>
  }
  customerInsights: {
    totalCustomers: number
    newCustomers: number
    customersWithOutstanding: number
    topCustomers: Array<{ customerId: string; customerName: string; revenue: number; transactionCount: number }>
  }
  financialHealth: {
    cashFlow: { inflow: number; outflow: number; net: number; trend: string }
    accountsReceivable: { current: number; overdue: number; total: number; overduePercentage: number }
    healthScore: number
  }
  lastUpdated: string
}

const periodOptions = [
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'this-quarter', label: 'This Quarter' },
  { value: 'this-year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
]

export default function ReportsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('this-month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (period === 'custom' && customStartDate && customEndDate) {
        params.append('startDate', customStartDate)
        params.append('endDate', customEndDate)
      } else {
        params.append('period', period)
      }

      const response = await fetch(`/api/reports/dashboard?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [period, customStartDate, customEndDate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (loading && !dashboardData) {
    return (
      <AppLayout title="Reports & Analytics">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Reports & Analytics">
      <div className="space-y-6">
        {/* Header with Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            <p className="text-gray-600">
              Comprehensive business insights and performance metrics
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {period === 'custom' && (
              <>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-40"
                />
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-40"
                />
              </>
            )}
            
            <Button onClick={fetchDashboardData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="tax">Tax</TabsTrigger>
            <TabsTrigger value="parties">Parties</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {dashboardData && (
              <>
                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(dashboardData.kpis.totalRevenue.value)}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        {getTrendIcon(dashboardData.kpis.totalRevenue.trend)}
                        <span className="ml-1">
                          {dashboardData.kpis.totalRevenue.growth > 0 ? '+' : ''}
                          {dashboardData.kpis.totalRevenue.growth.toFixed(1)}% from last period
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(dashboardData.kpis.grossProfit.value)}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        {getTrendIcon(dashboardData.kpis.grossProfit.trend)}
                        <span className="ml-1">
                          {dashboardData.kpis.grossProfit.margin.toFixed(1)}% margin
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(dashboardData.kpis.outstandingInvoices.value)}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <FileText className="h-3 w-3 mr-1" />
                        <span>{formatNumber(dashboardData.kpis.outstandingInvoices.count)} invoices</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(dashboardData.kpis.inventoryValue.value)}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Package className="h-3 w-3 mr-1" />
                        <span>{formatNumber(dashboardData.kpis.inventoryValue.items)} items</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts and Analytics */}
                <div className="grid gap-6 md:grid-cols-2">
                  <RevenueChart data={dashboardData.revenueTrends} />
                  <SalesAnalyticsChart data={dashboardData.salesAnalytics} />
                </div>

                {/* Additional Insights */}
                <div className="grid gap-6 md:grid-cols-3">
                  <InventoryInsights data={dashboardData.inventoryInsights} />
                  <CustomerInsights data={dashboardData.customerInsights} />
                  
                  {/* Financial Health Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Financial Health
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Health Score</span>
                        <span className={`text-2xl font-bold ${getHealthScoreColor(dashboardData.financialHealth.healthScore)}`}>
                          {dashboardData.financialHealth.healthScore.toFixed(0)}%
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Cash Flow</span>
                          <span className={dashboardData.financialHealth.cashFlow.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(dashboardData.financialHealth.cashFlow.net)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>Overdue Receivables</span>
                          <span className="text-red-600">
                            {formatCurrency(dashboardData.financialHealth.accountsReceivable.overdue)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>Current Receivables</span>
                          <span className="text-blue-600">
                            {formatCurrency(dashboardData.financialHealth.accountsReceivable.current)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="financial">
            <FinancialReports />
          </TabsContent>

          <TabsContent value="sales">
            <SalesReports />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryReports />
          </TabsContent>

          <TabsContent value="tax">
            <TaxReports />
          </TabsContent>

          <TabsContent value="parties">
            <PartiesReports />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
