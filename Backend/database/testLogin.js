/**
 * Test login directly against database
 * Usage: node database/testLogin.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDB } = require("../config/db");
const User = require("../models/User");

const test = async () => {
  await connectDB();

  const email = "admin@inventory.com";
  const password = "Admin@123";

  // Find user
  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.log("❌ User NOT found in database");
    process.exit(1);
  }

  console.log("✅ User found:", user.email, "| role:", user.role);
  console.log("🔑 Stored hash:", user.password);

  // Test bcrypt compare
  const match = await bcrypt.compare(password, user.password);
  console.log("🔐 Password match:", match ? "✅ YES" : "❌ NO");

  if (!match) {
    console.log("\n⚠️  Fixing password now...");
    const hashed = await bcrypt.hash(password, 10);
    await User.update({ password: hashed }, { where: { email }, hooks: false });
    console.log("✅ Password updated! Try logging in again.");
  }

  process.exit(0);
};

test().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
