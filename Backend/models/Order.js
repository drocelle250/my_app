const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const User    = require("./User");
const Product = require("./Product");

const Order = sequelize.define(
  "Order",
  {
    id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId:      { type: DataTypes.INTEGER, allowNull: false },
    status:      { type: DataTypes.ENUM("pending", "confirmed", "cancelled"), defaultValue: "pending" },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    note:        { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "orders", timestamps: true }
);

const OrderItem = sequelize.define(
  "OrderItem",
  {
    id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId:   { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    quantity:  { type: DataTypes.INTEGER, allowNull: false },
    unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  { tableName: "order_items", timestamps: false }
);

// Associations
Order.belongsTo(User,       { foreignKey: "userId",   as: "user" });
Order.hasMany(OrderItem,    { foreignKey: "orderId",  as: "items" });
OrderItem.belongsTo(Order,  { foreignKey: "orderId",  as: "order" });
OrderItem.belongsTo(Product,{ foreignKey: "productId",as: "product" });

module.exports = { Order, OrderItem };
