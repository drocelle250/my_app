require("dotenv").config();
const { connectDB, sequelize } = require("../config/db");
const User = require("../models/User");

const makeAdmin = async () => {
  await connectDB();

  // Find user by name or email containing "drocelle"
  const { Op } = require("sequelize");
  const user = await User.findOne({
    where: {
      [Op.or]: [
        { name:  { [Op.like]: "%drocelle%" } },
        { name:  { [Op.like]: "%UWAYESU%"  } },
        { email: { [Op.like]: "%drocelle%" } },
      ]
    }
  });

  if (!user) {
    console.log("❌ User not found. Showing all users:");
    const all = await User.findAll({ attributes: ["id", "name", "email", "role"] });
    all.forEach(u => console.log(`  id:${u.id} | ${u.name} | ${u.email} | ${u.role}`));
    await sequelize.close();
    process.exit(1);
  }

  await User.update({ role: "admin" }, { where: { id: user.id }, hooks: false });
  console.log(`✅ ${user.name} (${user.email}) is now ADMIN`);

  await sequelize.close();
  process.exit(0);
};

makeAdmin().catch((e) => { console.error(e.message); process.exit(1); });
