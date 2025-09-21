'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, FileText, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export function FinancialReports() {
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('this-month')
  const [reportType, setReportType] = useState('profit-loss')
  const [reportData, setReportData] = useState<any>(null)

  const fetchFinancialReport = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/financial?type=${reportType}&period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Error fetching financial report:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinancialReport()
  }, [reportType, period])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Financial Reports</h2>
          <p className="text-gray-600">Comprehensive financial analysis and statements</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-quarter">This Quarter</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Tabs */}
      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Profit & Loss Statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : reportData ? (
                <div className="space-y-4">
                  {/* Revenue Section */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-3">Revenue</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Sales Revenue</span>
                        <span className="font-medium">{formatCurrency(reportData.revenue?.sales || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Income</span>
                        <span className="font-medium">{formatCurrency(reportData.revenue?.otherIncome || 0)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total Revenue</span>
                        <span>{formatCurrency(reportData.revenue?.total || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-3">Expenses</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Cost of Goods Sold</span>
                        <span className="font-medium">{formatCurrency(reportData.expenses?.cogs || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Operating Expenses</span>
                        <span className="font-medium">{formatCurrency(reportData.expenses?.operating || 0)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total Expenses</span>
                        <span>{formatCurrency(reportData.expenses?.total || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Profit */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Net Profit</span>
                      <span className={`text-xl font-bold ${(reportData.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(reportData.netProfit || 0)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Profit Margin: {reportData.profitMargin?.toFixed(2) || 0}%
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No financial data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Balance Sheet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Balance Sheet report coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingDown className="h-5 w-5 mr-2" />
                Cash Flow Statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Cash Flow report coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
