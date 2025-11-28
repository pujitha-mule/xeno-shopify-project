import { format, subDays } from "date-fns";

export interface Customer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  ordersCount: number;
  lastOrderDate: string;
  avatar: string;
}

export interface Order {
  id: string;
  date: string;
  amount: number;
  status: "fulfilled" | "pending" | "cancelled";
}

export interface DailyStat {
  date: string;
  orders: number;
  revenue: number;
}

// Mock Data Generator
const generateDailyStats = (days: number): DailyStat[] => {
  const stats: DailyStat[] = [];
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    stats.push({
      date: format(date, "MMM dd"),
      orders: Math.floor(Math.random() * 50) + 10,
      revenue: Math.floor(Math.random() * 5000) + 1000,
    });
  }
  return stats;
};

export const mockDailyStats = generateDailyStats(30);

export const mockCustomers: Customer[] = [
  {
    id: "CUST-001",
    name: "Alice Freeman",
    email: "alice@example.com",
    totalSpent: 12450.00,
    ordersCount: 42,
    lastOrderDate: "2024-03-10",
    avatar: "https://i.pravatar.cc/150?u=alice",
  },
  {
    id: "CUST-002",
    name: "Bob Smith",
    email: "bob.smith@company.co",
    totalSpent: 8320.50,
    ordersCount: 28,
    lastOrderDate: "2024-03-12",
    avatar: "https://i.pravatar.cc/150?u=bob",
  },
  {
    id: "CUST-003",
    name: "Charlie Davis",
    email: "charlie.d@studio.io",
    totalSpent: 6150.75,
    ordersCount: 15,
    lastOrderDate: "2024-03-08",
    avatar: "https://i.pravatar.cc/150?u=charlie",
  },
  {
    id: "CUST-004",
    name: "Diana Prince",
    email: "diana@themyscira.net",
    totalSpent: 5900.00,
    ordersCount: 12,
    lastOrderDate: "2024-03-14",
    avatar: "https://i.pravatar.cc/150?u=diana",
  },
  {
    id: "CUST-005",
    name: "Evan Wright",
    email: "evan.wright@tech.com",
    totalSpent: 4200.25,
    ordersCount: 9,
    lastOrderDate: "2024-03-01",
    avatar: "https://i.pravatar.cc/150?u=evan",
  },
];

export const mockMetrics = {
  totalCustomers: 1248,
  totalOrders: 8563,
  totalRevenue: 482900.50,
  growth: {
    customers: 12.5,
    orders: 8.2,
    revenue: 15.3,
  }
};
