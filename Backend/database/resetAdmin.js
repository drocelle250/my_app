require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDB, sequelize } = require("../config/db");
const User = require("../models/User");

const reset = async () => {
  await connectDB();

  // Delete all users and recreate with fresh hashed passwords
  await User.destroy({ where: {}, force: true });

  const hash1 = await bcrypt.hash("Admin@123", 10);
  const hash2 = await bcrypt.hash("Manager@123", 10);
  const hash3 = await bcrypt.hash("Staff@123", 10);

  await User.bulkCreate([
    { name: "Alice Admin",  email: "admin@inventory.com",   password: hash1, role: "admin"   },
    { name: "Bob Manager",  email: "manager@inventory.com", password: hash2, role: "manager" },
    { name: "Carol Staff",  email: "staff@inventory.com",   password: hash3, role: "staff"   },
    { name: "David Staff",  email: "david@inventory.com",   password: hash3, role: "staff"   },
  ], { hooks: false }); // hooks: false = skip re-hashing, use our hash directly

  console.log("✅ Users reset successfully!");
  console.log("admin@inventory.com → Admin@123");
  console.log("manager@inventory.com → Manager@123");

  // Verify it works
  const user = await User.findOne({ where: { email: "admin@inventory.com" } });
  const match = await bcrypt.compare("Admin@123", user.password);
  console.log("Password verify test:", match ? "✅ PASS" : "❌ FAIL");

  await sequelize.close();
  process.exit(0);
};

reset().catch((e) => { console.error(e.message); process.exit(1); });
