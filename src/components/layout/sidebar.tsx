'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Package,
  FolderTree,
  ShoppingCart,
  ShoppingBag,
  TrendingUp,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  Building2
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Master Data',
    icon: Building2,
    children: [
      {
        name: 'Parties',
        href: '/parties',
        icon: Users,
      },
      {
        name: 'Items',
        href: '/items',
        icon: Package,
      },
      {
        name: 'Categories',
        href: '/categories',
        icon: FolderTree,
      },
    ],
  },
  {
    name: 'Transactions',
    icon: TrendingUp,
    children: [
      {
        name: 'Sales',
        href: '/sales',
        icon: ShoppingCart,
      },
      {
        name: 'Purchases',
        href: '/purchases',
        icon: ShoppingBag,
      },
      {
        name: 'Expenses & Income',
        href: '/expenses-income',
        icon: TrendingUp,
      },
    ],
  },
  {
    name: 'Financial',
    icon: FileText,
    children: [
      {
        name: 'Invoices',
        href: '/invoices',
        icon: FileText,
      },
      {
        name: 'Point of Sale',
        href: '/pos',
        icon: CreditCard,
      },
    ],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn('flex h-full w-64 flex-col bg-gray-900', className)}>
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold text-white">WeBill</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          if (item.children) {
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-300">
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </div>
                <div className="ml-6 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={cn(
                        'group flex items-center rounded-md px-3 py-2 text-sm font-medium',
                        pathname === child.href
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      )}
                    >
                      <child.icon className="mr-3 h-4 w-4" />
                      {child.name}
                    </Link>
                  ))}
                </div>
              </div>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium',
                pathname === item.href
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
