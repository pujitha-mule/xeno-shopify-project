import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";
import { 
  ArrowUpRight, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Calendar 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/layout";
import { useDashboardMetrics, useDailyStats, useTopCustomers } from "@/lib/api";
import { format } from "date-fns";
import { ProtectedRoute } from "@/components/protected-route";

const MetricCard = ({ title, value, trend, icon: Icon, colorClass }: any) => (
  <Card className="overflow-hidden relative">
    <div className={`absolute right-0 top-0 p-4 opacity-10 ${colorClass}`}>
      <Icon className="h-24 w-24 -mr-6 -mt-6" />
    </div>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className={`h-4 w-4 ${colorClass.replace('text-', 'text-opacity-100 text-')}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend !== undefined && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center">
          <span className="text-emerald-600 flex items-center font-medium">
            <ArrowUpRight className="h-3 w-3 mr-1" />
            +{trend}%
          </span>
          <span className="ml-1">from last month</span>
        </p>
      )}
    </CardContent>
  </Card>
);

function DashboardContent() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: dailyStats, isLoading: statsLoading } = useDailyStats(30);
  const { data: topCustomers, isLoading: customersLoading } = useTopCustomers(5);

  // Format daily stats for the chart
  const chartData = dailyStats?.map(stat => ({
    date: format(new Date(stat.date), 'MMM dd'),
    revenue: parseFloat(stat.revenue),
    orders: stat.orders,
  })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
            <p className="text-muted-foreground mt-1">Overview of your store's performance.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select defaultValue="30d">
              <SelectTrigger className="w-[180px] bg-card">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Metrics Grid */}
        {metricsLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-32 animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard 
              title="Total Revenue" 
              value={`$${parseFloat(metrics?.totalRevenue || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              trend={15.3}
              icon={DollarSign}
              colorClass="text-primary"
            />
            <MetricCard 
              title="Total Orders" 
              value={metrics?.totalOrders.toLocaleString() || '0'} 
              trend={8.2}
              icon={ShoppingBag}
              colorClass="text-purple-500"
            />
            <MetricCard 
              title="Active Customers" 
              value={metrics?.totalCustomers.toLocaleString() || '0'} 
              trend={12.5}
              icon={Users}
              colorClass="text-orange-500"
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-7">
          {/* Chart Section */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Revenue & Orders</CardTitle>
              <CardDescription>
                Daily performance over the last 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {statsLoading ? (
                <div className="h-[350px] w-full animate-pulse bg-muted/50 rounded" />
              ) : (
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `$${value}`} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          borderColor: "hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }} 
                        itemStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>
                Highest spending customers this month.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 animate-pulse bg-muted/50 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {topCustomers?.map((customer, index) => {
                    const initials = `${customer.firstName?.[0] || ''}${customer.lastName?.[0] || ''}`.toUpperCase() || customer.email[0].toUpperCase();
                    const fullName = customer.firstName && customer.lastName 
                      ? `${customer.firstName} ${customer.lastName}` 
                      : customer.email;
                    
                    return (
                      <div key={customer.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-primary transition-colors">
                            <AvatarFallback className="font-medium text-primary bg-primary/10">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                              {fullName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {customer.ordersCount} orders
                            </p>
                          </div>
                        </div>
                        <div className="text-right font-medium">
                          ${parseFloat(customer.totalSpent).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}