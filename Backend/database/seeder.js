/**
 * Node.js seeder — run once to populate the database
 * Usage: node database/seeder.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, connectDB } = require("../config/db");

// Import models so Sequelize registers them
const User         = require("../models/User");
const Category     = require("../models/Category");
const Product      = require("../models/Product");
const StockHistory = require("../models/StockHistory");

const seed = async () => {
  await connectDB();

  // ── Wipe existing data (order matters for FK constraints)
  await StockHistory.destroy({ where: {} });
  await Product.destroy({ where: {} });
  await Category.destroy({ where: {} });
  await User.destroy({ where: {} });
  console.log("Old data cleared");

  // ── Users (passwords are hashed by the model hook)
  const users = await User.bulkCreate([
    { name: "Alice Admin",  email: "admin@inventory.com",   password: "Admin@123",   role: "admin"   },
    { name: "Bob Manager",  email: "manager@inventory.com", password: "Manager@123", role: "manager" },
    { name: "Carol Staff",  email: "staff@inventory.com",   password: "Staff@123",   role: "staff"   },
    { name: "David Staff",  email: "david@inventory.com",   password: "Staff@123",   role: "staff"   },
  ], { individualHooks: true }); // individualHooks = true triggers beforeCreate for each row
  console.log(`Inserted ${users.length} users`);

  // ── Categories
  const categories = await Category.bulkCreate([
    { name: "Electronics",   description: "Electronic devices and accessories"      },
    { name: "Clothing",      description: "Apparel and fashion items"               },
    { name: "Food & Drinks", description: "Consumable food and beverage products"   },
    { name: "Furniture",     description: "Home and office furniture"               },
    { name: "Stationery",    description: "Office and school supplies"              },
  ]);
  console.log(`Inserted ${categories.length} categories`);

  const [elec, cloth, food, furn, stat] = categories;

  // ── Products
  const products = await Product.bulkCreate([
    // Electronics
    { name: "Laptop Pro 15",       sku: "ELEC-LAP-001", price: 1299.99, quantity: 25, lowStockThreshold: 5,  categoryId: elec.id,  description: "15-inch laptop, 16GB RAM, 512GB SSD"    },
    { name: "Wireless Mouse",      sku: "ELEC-MOU-002", price:   29.99, quantity: 80, lowStockThreshold: 10, categoryId: elec.id,  description: "Ergonomic wireless mouse, 2.4GHz"        },
    { name: "Mechanical Keyboard", sku: "ELEC-KEY-003", price:   89.99, quantity: 40, lowStockThreshold: 8,  categoryId: elec.id,  description: "RGB mechanical keyboard, TKL layout"     },
    { name: "USB-C Hub 7-in-1",    sku: "ELEC-HUB-004", price:   49.99, quantity: 60, lowStockThreshold: 10, categoryId: elec.id,  description: "7-port USB-C hub with HDMI & PD"         },
    { name: 'Monitor 27"',         sku: "ELEC-MON-005", price:  349.99, quantity:  8, lowStockThreshold: 5,  categoryId: elec.id,  description: "27-inch 4K IPS monitor"                  },
    // Clothing
    { name: "Men T-Shirt Blue",    sku: "CLTH-TSH-001", price:   19.99, quantity:120, lowStockThreshold: 20, categoryId: cloth.id, description: "100% cotton, sizes S-XXL"                },
    { name: "Women Jeans Slim",    sku: "CLTH-JNS-002", price:   49.99, quantity: 55, lowStockThreshold: 10, categoryId: cloth.id, description: "Slim fit denim jeans"                    },
    { name: "Hoodie Black",        sku: "CLTH-HOD-003", price:   39.99, quantity: 30, lowStockThreshold: 8,  categoryId: cloth.id, description: "Unisex fleece hoodie"                    },
    { name: "Running Shoes",       sku: "CLTH-SHO-004", price:   79.99, quantity:  7, lowStockThreshold: 5,  categoryId: cloth.id, description: "Lightweight running shoes"               },
    // Food & Drinks
    { name: "Mineral Water 1L",    sku: "FOOD-WAT-001", price:    0.99, quantity:500, lowStockThreshold: 50, categoryId: food.id,  description: "Natural mineral water, 1 litre"          },
    { name: "Green Tea Box",       sku: "FOOD-TEA-002", price:    5.99, quantity:200, lowStockThreshold: 30, categoryId: food.id,  description: "Box of 50 green tea bags"                },
    { name: "Protein Bar Pack",    sku: "FOOD-PRO-003", price:   24.99, quantity: 90, lowStockThreshold: 15, categoryId: food.id,  description: "Pack of 12 chocolate protein bars"       },
    { name: "Instant Coffee 200g", sku: "FOOD-COF-004", price:    8.99, quantity:  6, lowStockThreshold: 10, categoryId: food.id,  description: "Premium instant coffee, 200g jar"        },
    // Furniture
    { name: "Office Chair",        sku: "FURN-CHR-001", price:  199.99, quantity: 12, lowStockThreshold: 3,  categoryId: furn.id,  description: "Ergonomic mesh office chair"             },
    { name: "Standing Desk",       sku: "FURN-DSK-002", price:  349.99, quantity:  4, lowStockThreshold: 2,  categoryId: furn.id,  description: "Height-adjustable standing desk"         },
    { name: "Bookshelf 5-Tier",    sku: "FURN-BSH-003", price:   89.99, quantity: 18, lowStockThreshold: 3,  categoryId: furn.id,  description: "Wooden 5-tier bookshelf"                 },
    // Stationery
    { name: "Ballpoint Pens Box",  sku: "STAT-PEN-001", price:    4.99, quantity:300, lowStockThreshold: 30, categoryId: stat.id,  description: "Box of 50 blue ballpoint pens"           },
    { name: "A4 Paper Ream",       sku: "STAT-PAP-002", price:    6.99, quantity:150, lowStockThreshold: 20, categoryId: stat.id,  description: "500 sheets A4 80gsm paper"               },
    { name: "Sticky Notes Pack",   sku: "STAT-STK-003", price:    3.49, quantity: 80, lowStockThreshold: 15, categoryId: stat.id,  description: "Pack of 5 sticky note pads"              },
    { name: "Stapler Heavy Duty",  sku: "STAT-STP-004", price:   12.99, quantity:  9, lowStockThreshold: 5,  categoryId: stat.id,  description: "Heavy duty stapler, 50 sheets"           },
  ]);
  console.log(`Inserted ${products.length} products`);

  const [admin, manager, staff] = users;

  // ── Stock History
  const history = await StockHistory.bulkCreate([
    { productId: products[0].id,  type: "restock",    quantity:  30, note: "Initial stock intake",          performedById: admin.id   },
    { productId: products[0].id,  type: "sale",       quantity:  -5, note: "Sold to corporate client",      performedById: manager.id },
    { productId: products[1].id,  type: "restock",    quantity: 100, note: "Bulk purchase from supplier",   performedById: admin.id   },
    { productId: products[1].id,  type: "sale",       quantity: -20, note: "Online orders batch #1",        performedById: staff.id   },
    { productId: products[5].id,  type: "restock",    quantity: 150, note: "Summer collection arrival",     performedById: manager.id },
    { productId: products[5].id,  type: "sale",       quantity: -30, note: "Weekend sale event",            performedById: staff.id   },
    { productId: products[8].id,  type: "restock",    quantity:  10, note: "Restocked running shoes",       performedById: manager.id },
    { productId: products[8].id,  type: "sale",       quantity:  -3, note: "In-store sales",                performedById: staff.id   },
    { productId: products[9].id,  type: "restock",    quantity: 600, note: "Weekly beverage restock",       performedById: manager.id },
    { productId: products[9].id,  type: "sale",       quantity:-100, note: "Canteen supply",                performedById: staff.id   },
    { productId: products[12].id, type: "restock",    quantity:  10, note: "Low stock replenishment",       performedById: admin.id   },
    { productId: products[12].id, type: "sale",       quantity:  -4, note: "Sold in store",                 performedById: staff.id   },
    { productId: products[13].id, type: "restock",    quantity:  15, note: "New office chair shipment",     performedById: admin.id   },
    { productId: products[13].id, type: "sale",       quantity:  -3, note: "Sold to client offices",        performedById: manager.id },
    { productId: products[14].id, type: "restock",    quantity:   5, note: "Standing desk restock",         performedById: admin.id   },
    { productId: products[14].id, type: "sale",       quantity:  -1, note: "Sold one unit",                 performedById: staff.id   },
    { productId: products[16].id, type: "restock",    quantity: 400, note: "Quarterly stationery order",    performedById: manager.id },
    { productId: products[16].id, type: "sale",       quantity:-100, note: "Distributed to departments",    performedById: staff.id   },
    { productId: products[19].id, type: "restock",    quantity:  12, note: "Restocked staplers",            performedById: manager.id },
    { productId: products[19].id, type: "sale",       quantity:  -3, note: "Sold in store",                 performedById: staff.id   },
  ]);
  console.log(`Inserted ${history.length} stock history records`);

  console.log("\n✅ Database seeded successfully!");
  console.log("─────────────────────────────────────");
  console.log("Login credentials:");
  console.log("  admin@inventory.com   → Admin@123   (admin)");
  console.log("  manager@inventory.com → Manager@123 (manager)");
  console.log("  staff@inventory.com   → Staff@123   (staff)");
  console.log("─────────────────────────────────────");

  await sequelize.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seeder error:", err.message);
  process.exit(1);
});
