'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, FolderTree, Edit, Trash2, Eye, ChevronRight } from 'lucide-react'

interface Category {
  id: string
  name: string
  description?: string
  parentId?: string
  parent?: {
    id: string
    name: string
  }
  children?: Category[]
  items?: any[]
  createdAt: string
  updatedAt: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const renderCategoryTree = (categories: Category[], level = 0) => {
    const filteredCategories = categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return filteredCategories.map((category) => (
      <div key={category.id} className={`ml-${level * 4}`}>
        <Card className="mb-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {category.children && category.children.length > 0 && (
                  <button
                    onClick={() => toggleExpanded(category.id)}
                    className="mr-2 p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform ${
                        expandedCategories.has(category.id) ? 'rotate-90' : ''
                      }`} 
                    />
                  </button>
                )}
                <FolderTree className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  {category.parent && (
                    <p className="text-sm text-gray-500">
                      Parent: {category.parent.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {category.items?.length || 0} items
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {category.description && (
              <p className="text-sm text-gray-600 mb-3">{category.description}</p>
            )}
            <div className="flex justify-end space-x-2">
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
        
        {category.children && 
         category.children.length > 0 && 
         expandedCategories.has(category.id) && (
          <div className="ml-6 border-l-2 border-gray-200 pl-4">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  // Build tree structure from flat array
  const buildCategoryTree = (categories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>()
    const rootCategories: Category[] = []

    // First pass: create map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] })
    })

    // Second pass: build tree structure
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(categoryWithChildren)
        }
      } else {
        rootCategories.push(categoryWithChildren)
      }
    })

    return rootCategories
  }

  const categoryTree = buildCategoryTree(categories)

  if (loading) {
    return (
      <AppLayout title="Categories Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Categories Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setExpandedCategories(new Set(categories.map(c => c.id)))}
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              onClick={() => setExpandedCategories(new Set())}
            >
              Collapse All
            </Button>
          </div>
          <Link href="/categories/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Category
            </Button>
          </Link>
        </div>

        {/* Categories Tree */}
        <div className="space-y-2">
          {categoryTree.length > 0 ? (
            renderCategoryTree(categoryTree)
          ) : (
            <div className="text-center py-12">
              <FolderTree className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 text-lg">No categories found</div>
              <div className="text-gray-400 text-sm mt-2">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first category'
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
