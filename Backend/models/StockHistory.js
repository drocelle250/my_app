const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Product = require("./Product");
const User = require("./User");

const StockHistory = sequelize.define(
  "StockHistory",
  {
    id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    type:      { type: DataTypes.ENUM("restock", "sale", "removal", "adjustment"), allowNull: false },
    quantity:  { type: DataTypes.INTEGER, allowNull: false },   // positive = added, negative = removed
    note:      { type: DataTypes.TEXT, allowNull: true },
    performedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: "stock_history", timestamps: true }
);

StockHistory.belongsTo(Product, { foreignKey: "productId", as: "product" });
StockHistory.belongsTo(User,    { foreignKey: "performedById", as: "performedBy" });

module.exports = StockHistory;
