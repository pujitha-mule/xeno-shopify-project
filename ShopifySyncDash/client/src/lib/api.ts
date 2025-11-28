import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Tenant {
  id: number;
  name: string;
  apiKey?: string;
}

export interface AuthResponse {
  user: User;
  tenant: Tenant;
}

export interface Customer {
  id: number;
  tenantId: number;
  shopifyCustomerId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  totalSpent: string;
  ordersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  tenantId: number;
  shopifyOrderId: string;
  orderNumber: string;
  customerId: number | null;
  customerEmail: string | null;
  totalPrice: string;
  subtotalPrice: string | null;
  taxesIncluded: boolean | null;
  currency: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  tenantId: number;
  shopifyProductId: string;
  title: string;
  handle: string | null;
  productType: string | null;
  vendor: string | null;
  price: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: string;
}

export interface DailyStat {
  date: string;
  orders: number;
  revenue: string;
}

// API Client
class ApiClient {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    tenantName: string;
    shopifyDomain: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<void> {
    return this.request<void>('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/me');
  }

  // Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.request<DashboardMetrics>('/api/dashboard/metrics');
  }

  async getDailyStats(days: number = 30): Promise<DailyStat[]> {
    return this.request<DailyStat[]>(`/api/dashboard/daily-stats?days=${days}`);
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return this.request<Customer[]>('/api/customers');
  }

  async getTopCustomers(limit: number = 5): Promise<Customer[]> {
    return this.request<Customer[]>(`/api/customers/top?limit=${limit}`);
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/api/orders');
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return this.request<Product[]>('/api/products');
  }
}

export const api = new ApiClient();

// React Query Hooks

// Auth Hooks
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.getCurrentUser(),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.login(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      name: string;
      tenantName: string;
      shopifyDomain: string;
    }) => api.register(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// Dashboard Hooks
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: () => api.getDashboardMetrics(),
  });
}

export function useDailyStats(days: number = 30) {
  return useQuery({
    queryKey: ['dailyStats', days],
    queryFn: () => api.getDailyStats(days),
  });
}

// Customer Hooks
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers(),
  });
}

export function useTopCustomers(limit: number = 5) {
  return useQuery({
    queryKey: ['topCustomers', limit],
    queryFn: () => api.getTopCustomers(limit),
  });
}

// Order Hooks
export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => api.getOrders(),
  });
}

// Product Hooks
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  });
}
