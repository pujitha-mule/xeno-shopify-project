import { pgTable, text, integer, timestamp, decimal, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tenants (Stores) - Each Shopify store is a tenant
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shopifyDomain: text("shopify_domain").notNull().unique(),
  shopifyAccessToken: text("shopify_access_token"),
  apiKey: text("api_key").notNull().unique(), // For authenticating API requests
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
});
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

// Users - Dashboard users with tenant association
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Customers - From Shopify
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  shopifyCustomerId: text("shopify_customer_id").notNull(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0").notNull(),
  ordersCount: integer("orders_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Products - From Shopify
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  shopifyProductId: text("shopify_product_id").notNull(),
  title: text("title").notNull(),
  handle: text("handle"),
  productType: text("product_type"),
  vendor: text("vendor"),
  price: decimal("price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Orders - From Shopify
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  shopifyOrderId: text("shopify_order_id").notNull(),
  orderNumber: text("order_number").notNull(),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  customerEmail: text("customer_email"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  subtotalPrice: decimal("subtotal_price", { precision: 10, scale: 2 }),
  taxesIncluded: boolean("taxes_included").default(false),
  currency: text("currency").default("USD").notNull(),
  financialStatus: text("financial_status"), // paid, pending, refunded, etc.
  fulfillmentStatus: text("fulfillment_status"), // fulfilled, partial, null
  orderDate: timestamp("order_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Sync Log - Track when data was last synced from Shopify
export const syncLogs = pgTable("sync_logs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  syncType: text("sync_type").notNull(), // 'customers', 'products', 'orders', 'full'
  status: text("status").notNull(), // 'success', 'failed', 'in_progress'
  recordsProcessed: integer("records_processed").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertSyncLogSchema = createInsertSchema(syncLogs).omit({
  id: true,
});
export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;
export type SyncLog = typeof syncLogs.$inferSelect;
