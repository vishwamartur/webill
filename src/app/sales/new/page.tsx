'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { SalesTransactionForm } from '@/components/forms/sales-transaction-form'

export default function NewSalesTransactionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        router.push('/sales')
      } else {
        const error = await response.json()
        console.error('Failed to create sales transaction:', error)
        alert('Failed to create sales transaction: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating sales transaction:', error)
      alert('Error creating sales transaction')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/sales')
  }

  return (
    <AppLayout title="New Sales Transaction">
      <div className="max-w-7xl mx-auto">
        <SalesTransactionForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </AppLayout>
  )
}
