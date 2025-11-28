import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db";
import bcrypt from "bcrypt";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import crypto from "crypto";

const PgStore = pgSession(session);

// Extend Express Request type to include session user
declare module "express-session" {
  interface SessionData {
    userId?: number;
    tenantId?: number;
  }
}

// Middleware to check if user is authenticated
function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  tenantName: z.string().min(1),
  shopifyDomain: z.string().min(1),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup session
  app.use(
    session({
      store: new PgStore({
        pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "xeno-insights-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Generate API key for tenant
      const apiKey = crypto.randomBytes(32).toString("hex");

      // Create tenant
      const tenant = await storage.createTenant({
        name: data.tenantName,
        shopifyDomain: data.shopifyDomain,
        apiKey,
      });

      // Hash password and create user
      const passwordHash = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        tenantId: tenant.id,
        email: data.email,
        passwordHash,
        name: data.name,
      });

      // Set session
      req.session.userId = user.id;
      req.session.tenantId = user.tenantId;

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          apiKey: tenant.apiKey,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromError(error).toString() });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Get tenant info
      const tenant = await storage.getTenant(user.tenantId);
      if (!tenant) {
        return res.status(500).json({ message: "Tenant not found" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.tenantId = user.tenantId;

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromError(error).toString() });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const tenant = await storage.getTenant(user.tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
        },
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Dashboard API Routes
  app.get("/api/dashboard/metrics", requireAuth, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics(req.session.tenantId!);
      res.json(metrics);
    } catch (error) {
      console.error("Get metrics error:", error);
      res.status(500).json({ message: "Failed to get metrics" });
    }
  });

  app.get("/api/dashboard/daily-stats", requireAuth, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const stats = await storage.getDailyStats(req.session.tenantId!, days);
      res.json(stats);
    } catch (error) {
      console.error("Get daily stats error:", error);
      res.status(500).json({ message: "Failed to get daily stats" });
    }
  });

  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomers(req.session.tenantId!);
      res.json(customers);
    } catch (error) {
      console.error("Get customers error:", error);
      res.status(500).json({ message: "Failed to get customers" });
    }
  });

  app.get("/api/customers/top", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const customers = await storage.getTopCustomersBySpend(req.session.tenantId!, limit);
      res.json(customers);
    } catch (error) {
      console.error("Get top customers error:", error);
      res.status(500).json({ message: "Failed to get top customers" });
    }
  });

  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getOrders(req.session.tenantId!);
      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getProducts(req.session.tenantId!);
      res.json(products);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  // Shopify Webhook endpoint (for future use)
  app.post("/api/shopify/webhook", async (req, res) => {
    try {
      // Verify Shopify webhook (would need HMAC verification in production)
      const apiKey = req.headers["x-shopify-api-key"] as string;
      
      if (!apiKey) {
        return res.status(401).json({ message: "Missing API key" });
      }

      const tenant = await storage.getTenantByApiKey(apiKey);
      if (!tenant) {
        return res.status(401).json({ message: "Invalid API key" });
      }

      // Handle webhook data (customers, orders, products)
      // This would be expanded based on webhook type
      
      res.json({ message: "Webhook received" });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  return httpServer;
}
