'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Keyboard } from 'lucide-react'

interface POSShortcutsProps {
  onShortcut?: (action: string) => void
}

export function POSShortcuts({ onShortcut }: POSShortcutsProps) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      const key = event.key.toLowerCase()
      const ctrlKey = event.ctrlKey || event.metaKey

      // Handle keyboard shortcuts
      if (ctrlKey) {
        switch (key) {
          case 'f':
            event.preventDefault()
            onShortcut?.('focus-search')
            break
          case 'n':
            event.preventDefault()
            onShortcut?.('new-sale')
            break
          case 'p':
            event.preventDefault()
            onShortcut?.('process-payment')
            break
          case 'c':
            event.preventDefault()
            onShortcut?.('clear-cart')
            break
          case 'r':
            event.preventDefault()
            onShortcut?.('reports')
            break
          case 's':
            event.preventDefault()
            onShortcut?.('settings')
            break
        }
      } else {
        switch (key) {
          case 'f1':
            event.preventDefault()
            onShortcut?.('help')
            break
          case 'f2':
            event.preventDefault()
            onShortcut?.('customer-search')
            break
          case 'f3':
            event.preventDefault()
            onShortcut?.('barcode-search')
            break
          case 'f4':
            event.preventDefault()
            onShortcut?.('payment-cash')
            break
          case 'f5':
            event.preventDefault()
            onShortcut?.('payment-card')
            break
          case 'f6':
            event.preventDefault()
            onShortcut?.('payment-upi')
            break
          case 'escape':
            onShortcut?.('cancel')
            break
          case 'enter':
            if (event.shiftKey) {
              event.preventDefault()
              onShortcut?.('complete-sale')
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [onShortcut])

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center">
          <Keyboard className="h-4 w-4 mr-2" />
          Keyboard Shortcuts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Search Products:</span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+F</kbd>
            </div>
            <div className="flex justify-between">
              <span>New Sale:</span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+N</kbd>
            </div>
            <div className="flex justify-between">
              <span>Process Payment:</span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+P</kbd>
            </div>
            <div className="flex justify-between">
              <span>Clear Cart:</span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+C</kbd>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Customer Search:</span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">F2</kbd>
            </div>
            <div className="flex justify-between">
              <span>Cash Payment:</span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">F4</kbd>
            </div>
            <div className="flex justify-between">
              <span>Card Payment:</span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">F5</kbd>
            </div>
            <div className="flex justify-between">
              <span>Complete Sale:</span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Shift+Enter</kbd>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
