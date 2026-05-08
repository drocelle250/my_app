const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id:       { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name:     { type: DataTypes.STRING(100), allowNull: false },
    email:    { type: DataTypes.STRING(150), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    role:     { type: DataTypes.ENUM("admin", "manager", "staff"), defaultValue: "staff" },
    resetCode:    { type: DataTypes.STRING(6),  allowNull: true },
    resetExpires: { type: DataTypes.DATE,        allowNull: true },
  },
  { tableName: "users", timestamps: true }
);

// Hash password before create/update
const hashPassword = async (user) => {
  if (user.changed("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
};
User.beforeCreate(hashPassword);
User.beforeUpdate(hashPassword);

// Instance method
User.prototype.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = User;
