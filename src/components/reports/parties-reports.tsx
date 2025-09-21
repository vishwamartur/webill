'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Users, UserCheck, AlertTriangle, TrendingUp } from 'lucide-react'

export function PartiesReports() {
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('this-month')
  const [reportType, setReportType] = useState('overview')
  const [partyType, setPartyType] = useState('CUSTOMER')
  const [reportData, setReportData] = useState<any>(null)

  const fetchPartiesReport = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/parties?type=${reportType}&partyType=${partyType}&period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Error fetching parties report:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPartiesReport()
  }, [reportType, partyType, period])

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
          <h2 className="text-xl font-semibold">Parties Reports</h2>
          <p className="text-gray-600">Customer and supplier analysis with aging and credit reports</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={partyType} onValueChange={setPartyType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CUSTOMER">Customers</SelectItem>
              <SelectItem value="SUPPLIER">Suppliers</SelectItem>
            </SelectContent>
          </Select>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="aging">Aging</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="credit-analysis">Credit Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total {partyType === 'CUSTOMER' ? 'Customers' : 'Suppliers'}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.overview?.totalParties || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData?.overview?.newParties || 0} new this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active {partyType === 'CUSTOMER' ? 'Customers' : 'Suppliers'}</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reportData?.overview?.activeParties || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  With transactions this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transaction Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {reportData ? formatCurrency(reportData.overview?.totalTransactionValue || 0) : '$0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reportData?.overview?.totalTransactions || 0} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {reportData ? formatCurrency(reportData.overview?.averageTransactionValue || 0) : '$0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per transaction
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Parties */}
          {reportData?.topParties && (
            <Card>
              <CardHeader>
                <CardTitle>Top {partyType === 'CUSTOMER' ? 'Customers' : 'Suppliers'} by Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.topParties.slice(0, 8).map((party: any, index: number) => (
                    <div key={party.partyId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{party.partyName}</div>
                          <div className="text-sm text-muted-foreground">
                            {party.transactionCount} transactions
                            {party.outstandingAmount > 0 && (
                              <span className="text-red-600 ml-2">
                                • {formatCurrency(party.outstandingAmount)} outstanding
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(party.transactionValue)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(party.averageTransactionValue)} avg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="aging" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aging Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aging analysis coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{partyType === 'CUSTOMER' ? 'Customer' : 'Supplier'} Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Performance analysis coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credit Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {partyType === 'CUSTOMER' ? (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Credit analysis coming soon</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Credit analysis is only available for customers</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
