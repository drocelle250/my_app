const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Category = sequelize.define(
  "Category",
  {
    id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "categories", timestamps: true }
);

module.exports = Category;
