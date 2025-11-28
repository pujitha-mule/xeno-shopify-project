import { storage } from "./storage";
import bcrypt from "bcrypt";
import crypto from "crypto";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create a demo tenant
    const apiKey = crypto.randomBytes(32).toString("hex");
    const tenant = await storage.createTenant({
      name: "Demo Store",
      shopifyDomain: "demo-store.myshopify.com",
      apiKey,
    });
    console.log(`✅ Created tenant: ${tenant.name}`);
    console.log(`🔑 API Key: ${tenant.apiKey}`);

    // Create a demo user
    const passwordHash = await bcrypt.hash("password123", 10);
    const user = await storage.createUser({
      tenantId: tenant.id,
      email: "admin@xeno.co",
      passwordHash,
      name: "Admin User",
    });
    console.log(`✅ Created user: ${user.email}`);

    // Create demo customers
    const customerData = [
      {
        shopifyCustomerId: "cust_001",
        email: "alice.freeman@example.com",
        firstName: "Alice",
        lastName: "Freeman",
        phone: "+1234567890",
        totalSpent: "12450.00",
        ordersCount: 42,
      },
      {
        shopifyCustomerId: "cust_002",
        email: "bob.smith@company.co",
        firstName: "Bob",
        lastName: "Smith",
        phone: "+1234567891",
        totalSpent: "8320.50",
        ordersCount: 28,
      },
      {
        shopifyCustomerId: "cust_003",
        email: "charlie.davis@studio.io",
        firstName: "Charlie",
        lastName: "Davis",
        phone: "+1234567892",
        totalSpent: "6150.75",
        ordersCount: 15,
      },
      {
        shopifyCustomerId: "cust_004",
        email: "diana.prince@themyscira.net",
        firstName: "Diana",
        lastName: "Prince",
        phone: "+1234567893",
        totalSpent: "5900.00",
        ordersCount: 12,
      },
      {
        shopifyCustomerId: "cust_005",
        email: "evan.wright@tech.com",
        firstName: "Evan",
        lastName: "Wright",
        phone: "+1234567894",
        totalSpent: "4200.25",
        ordersCount: 9,
      },
    ];

    const customers = [];
    for (const data of customerData) {
      const customer = await storage.createCustomer({
        tenantId: tenant.id,
        ...data,
      });
      customers.push(customer);
    }
    console.log(`✅ Created ${customers.length} customers`);

    // Create demo products
    const productData = [
      {
        shopifyProductId: "prod_001",
        title: "Premium Wireless Headphones",
        handle: "wireless-headphones",
        productType: "Electronics",
        vendor: "AudioTech",
        price: "149.99",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
      },
      {
        shopifyProductId: "prod_002",
        title: "Smart Watch Series 5",
        handle: "smart-watch-5",
        productType: "Electronics",
        vendor: "TechGear",
        price: "299.99",
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
      },
      {
        shopifyProductId: "prod_003",
        title: "Leather Messenger Bag",
        handle: "leather-messenger-bag",
        productType: "Accessories",
        vendor: "Leather Co",
        price: "89.99",
        imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
      },
    ];

    const products = [];
    for (const data of productData) {
      const product = await storage.createProduct({
        tenantId: tenant.id,
        ...data,
      });
      products.push(product);
    }
    console.log(`✅ Created ${products.length} products`);

    // Create demo orders (distribute over last 30 days)
    const ordersData = [];
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date(now);
      orderDate.setDate(orderDate.getDate() - daysAgo);
      
      const customerIndex = Math.floor(Math.random() * customers.length);
      const customer = customers[customerIndex];
      
      const totalPrice = (Math.random() * 500 + 50).toFixed(2);
      
      ordersData.push({
        tenantId: tenant.id,
        shopifyOrderId: `order_${String(i + 1).padStart(4, '0')}`,
        orderNumber: `#${1000 + i}`,
        customerId: customer.id,
        customerEmail: customer.email,
        totalPrice,
        subtotalPrice: (parseFloat(totalPrice) * 0.9).toFixed(2),
        taxesIncluded: false,
        currency: "USD",
        financialStatus: Math.random() > 0.1 ? "paid" : "pending",
        fulfillmentStatus: Math.random() > 0.2 ? "fulfilled" : null,
        orderDate,
      });
    }

    for (const data of ordersData) {
      await storage.createOrder(data);
    }
    console.log(`✅ Created ${ordersData.length} orders`);

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📋 Login credentials:");
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: password123`);
    console.log(`\n🔑 Tenant API Key: ${tenant.apiKey}`);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("✅ Seed completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
