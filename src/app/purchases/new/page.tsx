'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PurchaseTransactionForm } from '@/components/forms/purchase-transaction-form'

export default function NewPurchaseTransactionPage() {
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
        router.push('/purchases')
      } else {
        const error = await response.json()
        console.error('Failed to create purchase order:', error)
        alert('Failed to create purchase order: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating purchase order:', error)
      alert('Error creating purchase order')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/purchases')
  }

  return (
    <AppLayout title="New Purchase Order">
      <div className="max-w-7xl mx-auto">
        <PurchaseTransactionForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </AppLayout>
  )
}
