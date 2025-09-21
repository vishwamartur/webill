'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateGSTIN, validatePAN } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface GSTInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
  required?: boolean
}

export function GSTINInput({ value, onChange, label = "GSTIN", placeholder = "Enter GSTIN", className, required }: GSTInputProps) {
  const [isValid, setIsValid] = useState(true)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase()
    onChange(newValue)
    
    if (newValue) {
      setIsValid(validateGSTIN(newValue))
    } else {
      setIsValid(true)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="gstin" className={cn(required && "after:content-['*'] after:text-red-500")}>
        {label}
      </Label>
      <Input
        id="gstin"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          className,
          !isValid && "border-red-500 focus:border-red-500"
        )}
        maxLength={15}
      />
      {!isValid && value && (
        <p className="text-sm text-red-500">Please enter a valid GSTIN</p>
      )}
      {isValid && value && value.length === 15 && (
        <p className="text-sm text-green-600">Valid GSTIN</p>
      )}
    </div>
  )
}

export function PANInput({ value, onChange, label = "PAN", placeholder = "Enter PAN", className, required }: GSTInputProps) {
  const [isValid, setIsValid] = useState(true)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase()
    onChange(newValue)
    
    if (newValue) {
      setIsValid(validatePAN(newValue))
    } else {
      setIsValid(true)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="pan" className={cn(required && "after:content-['*'] after:text-red-500")}>
        {label}
      </Label>
      <Input
        id="pan"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          className,
          !isValid && "border-red-500 focus:border-red-500"
        )}
        maxLength={10}
      />
      {!isValid && value && (
        <p className="text-sm text-red-500">Please enter a valid PAN</p>
      )}
      {isValid && value && value.length === 10 && (
        <p className="text-sm text-green-600">Valid PAN</p>
      )}
    </div>
  )
}
