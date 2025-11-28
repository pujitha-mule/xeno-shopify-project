import { 
  users, 
  tenants, 
  customers, 
  products, 
  orders,
  syncLogs,
  type User, 
  type InsertUser,
  type Tenant,
  type InsertTenant,
  type Customer,
  type InsertCustomer,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type InsertSyncLog,
  type SyncLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Tenant methods
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantByApiKey(apiKey: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  
  // Customer methods
  getCustomers(tenantId: number): Promise<Customer[]>;
  getTopCustomersBySpend(tenantId: number, limit: number): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  upsertCustomer(customer: InsertCustomer): Promise<Customer>;
  
  // Product methods
  getProducts(tenantId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  upsertProduct(product: InsertProduct): Promise<Product>;
  
  // Order methods
  getOrders(tenantId: number): Promise<Order[]>;
  getOrdersByDateRange(tenantId: number, startDate: Date, endDate: Date): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  
  // Analytics methods
  getDashboardMetrics(tenantId: number): Promise<{
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: string;
  }>;
  getDailyStats(tenantId: number, days: number): Promise<Array<{
    date: string;
    orders: number;
    revenue: string;
  }>>;
  
  // Sync log methods
  createSyncLog(log: InsertSyncLog): Promise<SyncLog>;
  updateSyncLog(id: number, updates: Partial<SyncLog>): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Tenant methods
  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant || undefined;
  }

  async getTenantByApiKey(apiKey: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.apiKey, apiKey));
    return tenant || undefined;
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(insertTenant).returning();
    return tenant;
  }

  // Customer methods
  async getCustomers(tenantId: number): Promise<Customer[]> {
    return await db.select()
      .from(customers)
      .where(eq(customers.tenantId, tenantId))
      .orderBy(desc(customers.totalSpent));
  }

  async getTopCustomersBySpend(tenantId: number, limit: number): Promise<Customer[]> {
    return await db.select()
      .from(customers)
      .where(eq(customers.tenantId, tenantId))
      .orderBy(desc(customers.totalSpent))
      .limit(limit);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async upsertCustomer(customer: InsertCustomer): Promise<Customer> {
    const [upserted] = await db
      .insert(customers)
      .values(customer)
      .onConflictDoUpdate({
        target: [customers.shopifyCustomerId, customers.tenantId],
        set: {
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          totalSpent: customer.totalSpent,
          ordersCount: customer.ordersCount,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  // Product methods
  async getProducts(tenantId: number): Promise<Product[]> {
    return await db.select()
      .from(products)
      .where(eq(products.tenantId, tenantId));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async upsertProduct(product: InsertProduct): Promise<Product> {
    const [upserted] = await db
      .insert(products)
      .values(product)
      .onConflictDoUpdate({
        target: [products.shopifyProductId, products.tenantId],
        set: {
          title: product.title,
          handle: product.handle,
          productType: product.productType,
          vendor: product.vendor,
          price: product.price,
          imageUrl: product.imageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  // Order methods
  async getOrders(tenantId: number): Promise<Order[]> {
    return await db.select()
      .from(orders)
      .where(eq(orders.tenantId, tenantId))
      .orderBy(desc(orders.orderDate))
      .limit(100);
  }

  async getOrdersByDateRange(tenantId: number, startDate: Date, endDate: Date): Promise<Order[]> {
    return await db.select()
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          gte(orders.orderDate, startDate),
          lte(orders.orderDate, endDate)
        )
      )
      .orderBy(desc(orders.orderDate));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  // Analytics methods
  async getDashboardMetrics(tenantId: number): Promise<{
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: string;
  }> {
    const [metrics] = await db
      .select({
        totalCustomers: sql<number>`count(distinct ${customers.id})::int`,
        totalOrders: sql<number>`count(${orders.id})::int`,
        totalRevenue: sql<string>`coalesce(sum(${orders.totalPrice}), 0)::text`,
      })
      .from(customers)
      .leftJoin(orders, and(
        eq(orders.tenantId, customers.tenantId),
        eq(orders.tenantId, tenantId)
      ))
      .where(eq(customers.tenantId, tenantId));

    return metrics || { totalCustomers: 0, totalOrders: 0, totalRevenue: '0' };
  }

  async getDailyStats(tenantId: number, days: number): Promise<Array<{
    date: string;
    orders: number;
    revenue: string;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db
      .select({
        date: sql<string>`to_char(${orders.orderDate}, 'YYYY-MM-DD')`,
        orders: sql<number>`count(*)::int`,
        revenue: sql<string>`sum(${orders.totalPrice})::text`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          gte(orders.orderDate, startDate)
        )
      )
      .groupBy(sql`to_char(${orders.orderDate}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${orders.orderDate}, 'YYYY-MM-DD')`);

    return stats;
  }

  // Sync log methods
  async createSyncLog(log: InsertSyncLog): Promise<SyncLog> {
    const [syncLog] = await db.insert(syncLogs).values(log).returning();
    return syncLog;
  }

  async updateSyncLog(id: number, updates: Partial<SyncLog>): Promise<void> {
    await db.update(syncLogs).set(updates).where(eq(syncLogs.id, id));
  }
}

export const storage = new DatabaseStorage();
