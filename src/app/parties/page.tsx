'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react'

interface Party {
  id: string
  type: 'CUSTOMER' | 'SUPPLIER' | 'VENDOR'
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  taxNumber?: string
  paymentTerms?: number
  creditLimit?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER' | 'VENDOR'>('ALL')

  useEffect(() => {
    fetchParties()
  }, [])

  const fetchParties = async () => {
    try {
      const response = await fetch('/api/parties')
      if (response.ok) {
        const data = await response.json()
        setParties(data.parties || [])
      }
    } catch (error) {
      console.error('Error fetching parties:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredParties = parties.filter(party => {
    const matchesSearch = party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         party.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         party.phone?.includes(searchTerm)
    const matchesFilter = filterType === 'ALL' || party.type === filterType
    return matchesSearch && matchesFilter
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CUSTOMER': return 'bg-blue-100 text-blue-800'
      case 'SUPPLIER': return 'bg-green-100 text-green-800'
      case 'VENDOR': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <AppLayout title="Parties Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Parties Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search parties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="CUSTOMER">Customers</option>
              <option value="SUPPLIER">Suppliers</option>
              <option value="VENDOR">Vendors</option>
            </select>
          </div>
          <Link href="/parties/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Party
            </Button>
          </Link>
        </div>

        {/* Parties Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredParties.map((party) => (
            <Card key={party.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{party.name}</CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(party.type)}`}>
                    {party.type}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  {party.email && (
                    <div className="flex items-center">
                      <span className="font-medium w-16">Email:</span>
                      <span>{party.email}</span>
                    </div>
                  )}
                  {party.phone && (
                    <div className="flex items-center">
                      <span className="font-medium w-16">Phone:</span>
                      <span>{party.phone}</span>
                    </div>
                  )}
                  {party.city && (
                    <div className="flex items-center">
                      <span className="font-medium w-16">City:</span>
                      <span>{party.city}</span>
                    </div>
                  )}
                  {party.paymentTerms && (
                    <div className="flex items-center">
                      <span className="font-medium w-16">Terms:</span>
                      <span>{party.paymentTerms} days</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredParties.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No parties found</div>
            <div className="text-gray-400 text-sm mt-2">
              {searchTerm || filterType !== 'ALL' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first party'
              }
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
