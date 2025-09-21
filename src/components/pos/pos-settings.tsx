'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Settings, 
  Printer, 
  Receipt, 
  DollarSign, 
  CreditCard,
  Barcode,
  Monitor,
  Save,
  RotateCcw
} from 'lucide-react'

interface POSSettings {
  // Receipt Settings
  receiptHeader: string
  receiptFooter: string
  showLogo: boolean
  printAutomatically: boolean
  
  // Payment Settings
  defaultPaymentMethod: 'CASH' | 'CARD' | 'UPI'
  allowPartialPayments: boolean
  requireCustomer: boolean
  
  // Display Settings
  itemsPerPage: number
  showItemImages: boolean
  defaultView: 'grid' | 'list'
  
  // Barcode Settings
  enableBarcodeScanner: boolean
  barcodeBeep: boolean
  
  // Tax Settings
  defaultTaxRate: number
  taxInclusive: boolean
  
  // Inventory Settings
  checkStock: boolean
  allowNegativeStock: boolean
  lowStockWarning: boolean
  lowStockThreshold: number
}

const defaultSettings: POSSettings = {
  receiptHeader: 'WeBill POS',
  receiptFooter: 'Thank you for your business!',
  showLogo: true,
  printAutomatically: false,
  defaultPaymentMethod: 'CASH',
  allowPartialPayments: true,
  requireCustomer: false,
  itemsPerPage: 20,
  showItemImages: false,
  defaultView: 'grid',
  enableBarcodeScanner: true,
  barcodeBeep: true,
  defaultTaxRate: 0,
  taxInclusive: false,
  checkStock: true,
  allowNegativeStock: false,
  lowStockWarning: true,
  lowStockThreshold: 10,
}

export function POSSettings() {
  const [settings, setSettings] = useState<POSSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // In a real application, this would load from an API or local storage
      const savedSettings = localStorage.getItem('posSettings')
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) })
      }
    } catch (error) {
      console.error('Error loading POS settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // In a real application, this would save to an API
      localStorage.setItem('posSettings', JSON.stringify(settings))
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving POS settings:', error)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setSettings(defaultSettings)
    }
  }

  const updateSetting = <K extends keyof POSSettings>(
    key: K,
    value: POSSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <Settings className="h-6 w-6 mr-2" />
          POS Settings
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={resetSettings}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Receipt Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Receipt Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="receiptHeader">Receipt Header</Label>
              <Input
                id="receiptHeader"
                value={settings.receiptHeader}
                onChange={(e) => updateSetting('receiptHeader', e.target.value)}
                placeholder="Your business name"
              />
            </div>
            
            <div>
              <Label htmlFor="receiptFooter">Receipt Footer</Label>
              <Input
                id="receiptFooter"
                value={settings.receiptFooter}
                onChange={(e) => updateSetting('receiptFooter', e.target.value)}
                placeholder="Thank you message"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="showLogo">Show Logo on Receipt</Label>
              <Switch
                id="showLogo"
                checked={settings.showLogo}
                onCheckedChange={(checked) => updateSetting('showLogo', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="printAutomatically">Print Automatically</Label>
              <Switch
                id="printAutomatically"
                checked={settings.printAutomatically}
                onCheckedChange={(checked) => updateSetting('printAutomatically', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payment Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="defaultPaymentMethod">Default Payment Method</Label>
              <select
                id="defaultPaymentMethod"
                value={settings.defaultPaymentMethod}
                onChange={(e) => updateSetting('defaultPaymentMethod', e.target.value as any)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="allowPartialPayments">Allow Partial Payments</Label>
              <Switch
                id="allowPartialPayments"
                checked={settings.allowPartialPayments}
                onCheckedChange={(checked) => updateSetting('allowPartialPayments', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="requireCustomer">Require Customer Selection</Label>
              <Switch
                id="requireCustomer"
                checked={settings.requireCustomer}
                onCheckedChange={(checked) => updateSetting('requireCustomer', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Display Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="itemsPerPage">Items Per Page</Label>
              <Input
                id="itemsPerPage"
                type="number"
                min="10"
                max="100"
                value={settings.itemsPerPage}
                onChange={(e) => updateSetting('itemsPerPage', parseInt(e.target.value) || 20)}
              />
            </div>
            
            <div>
              <Label htmlFor="defaultView">Default View</Label>
              <select
                id="defaultView"
                value={settings.defaultView}
                onChange={(e) => updateSetting('defaultView', e.target.value as any)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="grid">Grid View</option>
                <option value="list">List View</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="showItemImages">Show Item Images</Label>
              <Switch
                id="showItemImages"
                checked={settings.showItemImages}
                onCheckedChange={(checked) => updateSetting('showItemImages', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Barcode Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Barcode className="h-5 w-5 mr-2" />
              Barcode Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enableBarcodeScanner">Enable Barcode Scanner</Label>
              <Switch
                id="enableBarcodeScanner"
                checked={settings.enableBarcodeScanner}
                onCheckedChange={(checked) => updateSetting('enableBarcodeScanner', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="barcodeBeep">Barcode Scan Beep</Label>
              <Switch
                id="barcodeBeep"
                checked={settings.barcodeBeep}
                onCheckedChange={(checked) => updateSetting('barcodeBeep', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Tax Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
              <Input
                id="defaultTaxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.defaultTaxRate}
                onChange={(e) => updateSetting('defaultTaxRate', parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="taxInclusive">Tax Inclusive Pricing</Label>
              <Switch
                id="taxInclusive"
                checked={settings.taxInclusive}
                onCheckedChange={(checked) => updateSetting('taxInclusive', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Printer className="h-5 w-5 mr-2" />
              Inventory Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="checkStock">Check Stock Availability</Label>
              <Switch
                id="checkStock"
                checked={settings.checkStock}
                onCheckedChange={(checked) => updateSetting('checkStock', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="allowNegativeStock">Allow Negative Stock</Label>
              <Switch
                id="allowNegativeStock"
                checked={settings.allowNegativeStock}
                onCheckedChange={(checked) => updateSetting('allowNegativeStock', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="lowStockWarning">Low Stock Warning</Label>
              <Switch
                id="lowStockWarning"
                checked={settings.lowStockWarning}
                onCheckedChange={(checked) => updateSetting('lowStockWarning', checked)}
              />
            </div>
            
            {settings.lowStockWarning && (
              <div>
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={settings.lowStockThreshold}
                  onChange={(e) => updateSetting('lowStockThreshold', parseInt(e.target.value) || 10)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
