import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  Users, 
  ShoppingCart, 
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

// Mock data - will be replaced with real data from database
const stats = [
  {
    title: 'Total Revenue',
    value: '$45,231.89',
    change: '+20.1%',
    changeType: 'positive' as const,
    icon: DollarSign,
  },
  {
    title: 'Active Customers',
    value: '2,350',
    change: '+180.1%',
    changeType: 'positive' as const,
    icon: Users,
  },
  {
    title: 'Sales This Month',
    value: '12,234',
    change: '+19%',
    changeType: 'positive' as const,
    icon: ShoppingCart,
  },
  {
    title: 'Pending Invoices',
    value: '573',
    change: '-4.3%',
    changeType: 'negative' as const,
    icon: FileText,
  },
]

const recentTransactions = [
  {
    id: '1',
    customer: 'Acme Corp',
    amount: '$2,500.00',
    status: 'Paid',
    date: '2024-01-15',
  },
  {
    id: '2',
    customer: 'Tech Solutions',
    amount: '$1,200.00',
    status: 'Pending',
    date: '2024-01-14',
  },
  {
    id: '3',
    customer: 'Global Industries',
    amount: '$3,800.00',
    status: 'Paid',
    date: '2024-01-13',
  },
  {
    id: '4',
    customer: 'StartUp Inc',
    amount: '$950.00',
    status: 'Overdue',
    date: '2024-01-10',
  },
]

export default function DashboardPage() {
  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  <span className={stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}>
                    {stat.change}
                  </span>
                  <span className="ml-1">from last month</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {transaction.customer}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{transaction.amount}</p>
                      <p className={`text-xs ${
                        transaction.status === 'Paid' ? 'text-green-500' :
                        transaction.status === 'Pending' ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {transaction.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full text-left p-3 rounded-md hover:bg-gray-50 border">
                Create New Invoice
              </button>
              <button className="w-full text-left p-3 rounded-md hover:bg-gray-50 border">
                Add New Customer
              </button>
              <button className="w-full text-left p-3 rounded-md hover:bg-gray-50 border">
                Record Sale
              </button>
              <button className="w-full text-left p-3 rounded-md hover:bg-gray-50 border">
                View Reports
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
