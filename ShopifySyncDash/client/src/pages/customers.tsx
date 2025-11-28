import DashboardLayout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCustomers } from "@/lib/api";
import { ProtectedRoute } from "@/components/protected-route";

function CustomersContent() {
  const { data: customers, isLoading } = useCustomers();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground mt-1">Manage and view your customer base.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-20 animate-pulse bg-muted/50 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {customers?.map((customer) => {
                  const initials = `${customer.firstName?.[0] || ''}${customer.lastName?.[0] || ''}`.toUpperCase() || customer.email[0].toUpperCase();
                  const fullName = customer.firstName && customer.lastName 
                    ? `${customer.firstName} ${customer.lastName}` 
                    : customer.email;

                  return (
                    <div key={customer.id} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-lg">{fullName}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${parseFloat(customer.totalSpent).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        <p className="text-sm text-muted-foreground">{customer.ordersCount} orders</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function CustomersPage() {
  return (
    <ProtectedRoute>
      <CustomersContent />
    </ProtectedRoute>
  );
}