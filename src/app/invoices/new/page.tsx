'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { InvoiceForm } from '@/components/forms/invoice-form'

export default function NewInvoicePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const invoice = await response.json()
        router.push(`/invoices/${invoice.id}`)
      } else {
        const error = await response.json()
        console.error('Failed to create invoice:', error)
        alert('Failed to create invoice: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Error creating invoice')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/invoices')
  }

  return (
    <AppLayout title="Create New Invoice">
      <div className="max-w-7xl mx-auto">
        <InvoiceForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </AppLayout>
  )
}
