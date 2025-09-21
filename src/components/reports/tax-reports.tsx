'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, FileText, Calculator, AlertCircle, CheckCircle } from 'lucide-react'

export function TaxReports() {
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('this-quarter')
  const [reportType, setReportType] = useState('summary')
  const [reportData, setReportData] = useState<any>(null)

  const fetchTaxReport = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/tax?type=${reportType}&period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Error fetching tax report:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTaxReport()
  }, [reportType, period])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Tax Reports</h2>
          <p className="text-gray-600">GST/VAT summaries and tax compliance reporting</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="this-quarter">This Quarter</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Report Tabs */}
      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="gst-return">GST Return</TabsTrigger>
          <TabsTrigger value="liability">Liability</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Output Tax</CardTitle>
                <Calculator className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reportData ? formatCurrency(reportData.summary?.outputTax?.total || 0) : '$0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tax collected on sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Input Tax</CardTitle>
                <Calculator className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {reportData ? formatCurrency(reportData.summary?.inputTax?.total || 0) : '$0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tax paid on purchases
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Tax Liability</CardTitle>
                <FileText className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(reportData?.summary?.netTaxLiability || 0) >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  {reportData ? formatCurrency(reportData.summary?.netTaxLiability || 0) : '$0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Amount owed to tax authority
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxable Revenue</CardTitle>
                <Calculator className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {reportData ? formatCurrency(reportData.summary?.taxableRevenue || 0) : '$0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total taxable sales
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tax Breakdown */}
          {reportData?.breakdown && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Tax by Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.breakdown.salesTaxByRate?.map((rate: any) => (
                      <div key={rate.taxRate} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{rate.taxRate}% Tax Rate</div>
                          <div className="text-sm text-muted-foreground">
                            {rate.transactionCount} transactions
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(rate.taxAmount)}</div>
                          <div className="text-sm text-muted-foreground">
                            on {formatCurrency(rate.taxableAmount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Purchase Tax by Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.breakdown.purchaseTaxByRate?.map((rate: any) => (
                      <div key={rate.taxRate} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{rate.taxRate}% Tax Rate</div>
                          <div className="text-sm text-muted-foreground">
                            {rate.transactionCount} transactions
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(rate.taxAmount)}</div>
                          <div className="text-sm text-muted-foreground">
                            on {formatCurrency(rate.taxableAmount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gst-return" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GST Return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>GST return format coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tax liability analysis coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : reportData?.compliance ? (
                <div className="space-y-6">
                  {/* Compliance Score */}
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {reportData.compliance.complianceScore}%
                    </div>
                    <div className="text-sm text-gray-600">Compliance Score</div>
                  </div>

                  {/* Issues */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Issues Found
                      </h3>
                      <div className="space-y-2">
                        {reportData.compliance.issues.transactionsWithoutTax > 0 && (
                          <div className="text-sm">
                            • {reportData.compliance.issues.transactionsWithoutTax} transactions missing tax
                          </div>
                        )}
                        {reportData.compliance.issues.invoicesWithoutTax > 0 && (
                          <div className="text-sm">
                            • {reportData.compliance.issues.invoicesWithoutTax} invoices missing tax
                          </div>
                        )}
                        {reportData.compliance.issues.partiesWithoutTaxNumber > 0 && (
                          <div className="text-sm">
                            • {reportData.compliance.issues.partiesWithoutTaxNumber} parties missing tax numbers
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-green-600 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Recommendations
                      </h3>
                      <div className="space-y-2">
                        {reportData.compliance.recommendations?.map((rec: string, index: number) => (
                          <div key={index} className="text-sm">• {rec}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Tax compliance analysis coming soon</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
