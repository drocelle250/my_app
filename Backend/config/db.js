const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL connected successfully");
    // sync all models (alter: true updates columns without dropping data)
    await sequelize.sync({ alter: true });
    console.log("All tables synced");
  } catch (error) {
    console.error("MySQL connection error:", error.message);
    console.error("Details:", error.original || error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
