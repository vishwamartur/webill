'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { getGSTRates, getDefaultGSTRate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface GSTRateSelectorProps {
  value: number
  onChange: (value: number) => void
  label?: string
  className?: string
  required?: boolean
  disabled?: boolean
}

export function GSTRateSelector({ 
  value, 
  onChange, 
  label = "GST Rate", 
  className, 
  required,
  disabled 
}: GSTRateSelectorProps) {
  const gstRates = getGSTRates()
  const defaultRate = getDefaultGSTRate()

  const handleValueChange = (stringValue: string) => {
    onChange(parseFloat(stringValue))
  }

  return (
    <div className="space-y-2">
      <Label className={cn(required && "after:content-['*'] after:text-red-500")}>
        {label}
      </Label>
      <Select 
        value={value.toString()} 
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder="Select GST rate" />
        </SelectTrigger>
        <SelectContent>
          {gstRates.map((rate) => (
            <SelectItem key={rate} value={rate.toString()}>
              {rate}% GST
              {rate === 0 && " (Exempt)"}
              {rate === defaultRate && " (Default)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface GSTBreakdownProps {
  amount: number
  gstRate: number
  isInterState?: boolean
  className?: string
}

export function GSTBreakdown({ amount, gstRate, isInterState = false, className }: GSTBreakdownProps) {
  const gstAmount = (amount * gstRate) / 100
  
  const breakdown = isInterState 
    ? {
        cgst: 0,
        sgst: 0,
        igst: gstAmount,
        total: gstAmount
      }
    : {
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        igst: 0,
        total: gstAmount
      }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value)
  }

  if (gstRate === 0) {
    return (
      <div className={cn("text-sm text-gray-600", className)}>
        GST Exempt
      </div>
    )
  }

  return (
    <div className={cn("space-y-1 text-sm", className)}>
      <div className="font-medium">GST Breakdown ({gstRate}%):</div>
      {isInterState ? (
        <div className="text-gray-600">
          IGST: {formatCurrency(breakdown.igst)}
        </div>
      ) : (
        <div className="text-gray-600 space-y-1">
          <div>CGST ({gstRate/2}%): {formatCurrency(breakdown.cgst)}</div>
          <div>SGST ({gstRate/2}%): {formatCurrency(breakdown.sgst)}</div>
        </div>
      )}
      <div className="font-medium border-t pt-1">
        Total GST: {formatCurrency(breakdown.total)}
      </div>
    </div>
  )
}
