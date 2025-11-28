import DashboardLayout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/lib/api";
import { format } from "date-fns";
import { ProtectedRoute } from "@/components/protected-route";

function OrdersContent() {
  const { data: orders, isLoading } = useOrders();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground mt-1">Track and manage store orders.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 animate-pulse bg-muted/50 rounded" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="grid grid-cols-5 gap-4 p-4 font-medium text-muted-foreground bg-muted/50 text-sm">
                  <div>Order ID</div>
                  <div>Customer</div>
                  <div>Date</div>
                  <div>Total</div>
                  <div>Status</div>
                </div>
                <div className="divide-y">
                  {orders?.map((order) => {
                    const statusVariant = 
                      order.financialStatus === 'paid' ? 'default' : 
                      order.financialStatus === 'pending' ? 'secondary' : 'destructive';
                    
                    return (
                      <div key={order.id} className="grid grid-cols-5 gap-4 p-4 text-sm items-center hover:bg-muted/20 transition-colors">
                        <div className="font-medium">{order.orderNumber}</div>
                        <div>{order.customerEmail || 'Guest'}</div>
                        <div className="text-muted-foreground">{format(new Date(order.orderDate), 'MMM dd, yyyy')}</div>
                        <div className="font-medium text-foreground">
                          ${parseFloat(order.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div>
                          <Badge variant={statusVariant}>
                            {order.financialStatus || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  );
}