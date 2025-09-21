'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { POSSettings } from '@/components/pos/pos-settings'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function POSSettingsPage() {
  const router = useRouter()

  return (
    <AppLayout title="POS Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/pos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to POS
          </Button>
        </div>

        {/* Settings Component */}
        <POSSettings />
      </div>
    </AppLayout>
  )
}
