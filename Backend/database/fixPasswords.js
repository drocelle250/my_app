/**
 * Fix passwords — run this once
 * Usage: node database/fixPasswords.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, connectDB } = require("../config/db");
const User = require("../models/User");

const fix = async () => {
  await connectDB();

  const users = [
    { email: "admin@inventory.com",   password: "Admin@123"   },
    { email: "manager@inventory.com", password: "Manager@123" },
    { email: "staff@inventory.com",   password: "Staff@123"   },
    { email: "david@inventory.com",   password: "Staff@123"   },
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await User.update(
      { password: hashed },
      { where: { email: u.email }, hooks: false } // hooks:false skips re-hashing
    );
    console.log(`✅ Fixed password for ${u.email}`);
  }

  console.log("\nAll passwords fixed! Try logging in now.");
  await sequelize.close();
  process.exit(0);
};

fix().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
