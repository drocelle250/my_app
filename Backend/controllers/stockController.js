const { sequelize } = require("../config/db");
const Product      = require("../models/Product");
const StockHistory = require("../models/StockHistory");
const Category     = require("../models/Category");
const User         = require("../models/User");

// Helper: apply stock change inside a transaction
const applyStockChange = async (productId, delta, type, note, userId) => {
  return await sequelize.transaction(async (t) => {
    const product = await Product.findByPk(productId, { transaction: t, lock: true });
    if (!product) throw Object.assign(new Error("Product not found"), { statusCode: 404 });

    const newQty = product.quantity + delta;
    if (newQty < 0) throw Object.assign(new Error("Insufficient stock"), { statusCode: 400 });

    await product.update({ quantity: newQty }, { transaction: t });

    await StockHistory.create(
      { productId, type, quantity: delta, note, performedById: userId },
      { transaction: t }
    );

    return product;
  });
};

// POST /api/stock/restock
exports.restock = async (req, res) => {
  try {
    const { productId, quantity, note } = req.body;
    const product = await applyStockChange(Number(productId), Number(quantity), "restock", note, req.user.id);
    res.json({ message: "Stock increased", quantity: product.quantity });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

// POST /api/stock/deduct
exports.deduct = async (req, res) => {
  try {
    const { productId, quantity, type = "sale", note } = req.body;
    const product = await applyStockChange(Number(productId), -Number(quantity), type, note, req.user.id);
    res.json({ message: "Stock decreased", quantity: product.quantity });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

// GET /api/stock/history/:productId
exports.history = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await StockHistory.findAndCountAll({
      where: { productId: req.params.productId },
      include: [{ model: User, as: "performedBy", attributes: ["id", "name", "email"] }],
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset,
    });

    res.json({ total: count, page: Number(page), history: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/stock/low-stock
exports.lowStock = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
    });
    const low = products.filter((p) => p.isLowStock());
    res.json({ count: low.length, products: low });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/stock/dashboard
exports.dashboard = async (req, res) => {
  try {
    const [totalProducts, totalUsers, totalCategories, allProducts] = await Promise.all([
      Product.count(),
      User.count(),
      Category.count(),
      Product.findAll(),
    ]);

    const lowStockCount = allProducts.filter((p) => p.isLowStock()).length;
    const totalInventoryValue = allProducts.reduce(
      (sum, p) => sum + parseFloat(p.price) * p.quantity,
      0
    );

    res.json({ totalProducts, totalUsers, totalCategories, lowStockCount, totalInventoryValue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
