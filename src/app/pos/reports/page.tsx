'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { POSAnalytics } from '@/components/pos/pos-analytics'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function POSReportsPage() {
  const router = useRouter()

  return (
    <AppLayout title="POS Reports & Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/pos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to POS
          </Button>
        </div>

        {/* Analytics Component */}
        <POSAnalytics />

        {/* Additional Reports Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.print()}
              >
                Print Today's Report
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  // Export functionality can be added here
                  alert('Export functionality coming soon!')
                }}
              >
                Export to CSV
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/pos')}
              >
                Return to POS
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Report Generated:</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Source:</span>
                  <span>POS Transactions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Update Frequency:</span>
                  <span>Real-time</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Zone:</span>
                  <span>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
