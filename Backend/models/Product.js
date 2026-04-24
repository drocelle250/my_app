const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Category = require("./Category");

const Product = sequelize.define(
  "Product",
  {
    id:                { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name:              { type: DataTypes.STRING(150), allowNull: false },
    sku:               { type: DataTypes.STRING(100), allowNull: false, unique: true },
    price:             { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    quantity:          { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    description:       { type: DataTypes.TEXT, allowNull: true },
    lowStockThreshold: { type: DataTypes.INTEGER, defaultValue: 10 },
    categoryId:        { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "products", timestamps: true }
);

// Associations
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
Category.hasMany(Product,   { foreignKey: "categoryId", as: "products" });

// Virtual: is stock low?
Product.prototype.isLowStock = function () {
  return this.quantity <= this.lowStockThreshold;
};

module.exports = Product;
