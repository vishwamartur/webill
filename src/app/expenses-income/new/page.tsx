'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { ExpenseIncomeForm } from '@/components/forms/expense-income-form'

export default function NewExpenseIncomePage() {
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
        router.push('/expenses-income')
      } else {
        const error = await response.json()
        console.error('Failed to create transaction:', error)
        alert('Failed to create transaction: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      alert('Error creating transaction')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/expenses-income')
  }

  return (
    <AppLayout title="New Expense/Income Transaction">
      <div className="max-w-5xl mx-auto">
        <ExpenseIncomeForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </AppLayout>
  )
}
