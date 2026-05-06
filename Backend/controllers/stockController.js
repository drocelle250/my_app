const { sequelize } = require("../config/db");
const Product      = require("../models/Product");
const StockHistory = require("../models/StockHistory");
const Category     = require("../models/Category");
const User         = require("../models/User");
const { Op, fn, col, literal } = require("sequelize");

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

// GET /api/stock/analytics
// Full analytics: inflows, outflows, revenue, stock value, prediction
exports.analytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    // ── 1. All products with category ──────────────────────────────────────
    const allProducts = await Product.findAll({
      include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
    });

    // ── 2. All stock history in period ─────────────────────────────────────
    const history = await StockHistory.findAll({
      where: { createdAt: { [Op.gte]: since } },
      include: [
        { model: Product, as: "product", attributes: ["id", "name", "sku", "price"] },
        { model: User,    as: "performedBy", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    // ── 3. ALL history (for prediction — need full history) ─────────────────
    const allHistory = await StockHistory.findAll({
      order: [["createdAt", "ASC"]],
    });

    // ── 4. Summary calculations ─────────────────────────────────────────────
    let totalIn = 0, totalOut = 0, revenueFromSales = 0;

    history.forEach((h) => {
      if (h.quantity > 0) {
        totalIn += h.quantity;
      } else {
        totalOut += Math.abs(h.quantity);
        if (h.type === "sale" && h.product) {
          revenueFromSales += Math.abs(h.quantity) * parseFloat(h.product.price);
        }
      }
    });

    // Current stock value
    const currentStockValue = allProducts.reduce(
      (sum, p) => sum + parseFloat(p.price) * p.quantity, 0
    );

    // ── 5. Daily flow chart data (last N days) ──────────────────────────────
    const dailyMap = {};
    for (let i = Number(days) - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = { date: key, inflow: 0, outflow: 0, revenue: 0 };
    }
    history.forEach((h) => {
      const key = new Date(h.createdAt).toISOString().slice(0, 10);
      if (!dailyMap[key]) return;
      if (h.quantity > 0) {
        dailyMap[key].inflow += h.quantity;
      } else {
        dailyMap[key].outflow += Math.abs(h.quantity);
        if (h.type === "sale" && h.product) {
          dailyMap[key].revenue += Math.abs(h.quantity) * parseFloat(h.product.price);
        }
      }
    });
    const dailyFlow = Object.values(dailyMap);

    // ── 6. Top selling products ─────────────────────────────────────────────
    const salesMap = {};
    history.filter((h) => h.type === "sale" && h.quantity < 0).forEach((h) => {
      const pid = h.productId;
      if (!salesMap[pid]) salesMap[pid] = { product: h.product, sold: 0, revenue: 0 };
      salesMap[pid].sold    += Math.abs(h.quantity);
      salesMap[pid].revenue += Math.abs(h.quantity) * parseFloat(h.product?.price || 0);
    });
    const topSelling = Object.values(salesMap)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    // ── 7. Per-product analytics ────────────────────────────────────────────
    const productAnalytics = allProducts.map((p) => {
      const ph = allHistory.filter((h) => h.productId === p.id);
      const soldTotal  = ph.filter((h) => h.type === "sale").reduce((s, h) => s + Math.abs(h.quantity), 0);
      const restocked  = ph.filter((h) => h.type === "restock").reduce((s, h) => s + h.quantity, 0);

      // Prediction: avg daily sales over last 30 days
      const recentSales = history.filter((h) => h.productId === p.id && h.type === "sale");
      const avgDailySales = recentSales.length > 0
        ? recentSales.reduce((s, h) => s + Math.abs(h.quantity), 0) / Number(days)
        : 0;

      // Days until stockout
      const daysUntilStockout = avgDailySales > 0
        ? Math.floor(p.quantity / avgDailySales)
        : null;

      // Recommended restock: 30-day supply
      const recommendedRestock = avgDailySales > 0
        ? Math.max(0, Math.ceil(avgDailySales * 30) - p.quantity)
        : 0;

      return {
        id:                p.id,
        name:              p.name,
        sku:               p.sku,
        category:          p.category?.name || "—",
        currentQty:        p.quantity,
        price:             parseFloat(p.price),
        stockValue:        parseFloat(p.price) * p.quantity,
        soldTotal,
        restocked,
        avgDailySales:     Math.round(avgDailySales * 100) / 100,
        daysUntilStockout,
        recommendedRestock,
        isLow:             p.isLowStock(),
        lowStockThreshold: p.lowStockThreshold,
        revenueGenerated:  soldTotal * parseFloat(p.price),
      };
    });

    // ── 8. Low stock needing restock ────────────────────────────────────────
    const needsRestock = productAnalytics
      .filter((p) => p.isLow || (p.daysUntilStockout !== null && p.daysUntilStockout <= 7))
      .sort((a, b) => (a.daysUntilStockout ?? 999) - (b.daysUntilStockout ?? 999));

    // ── 9. Movement type breakdown ──────────────────────────────────────────
    const typeBreakdown = { restock: 0, sale: 0, removal: 0, adjustment: 0 };
    history.forEach((h) => {
      if (typeBreakdown[h.type] !== undefined)
        typeBreakdown[h.type] += Math.abs(h.quantity);
    });

    res.json({
      period:           Number(days),
      summary: {
        totalIn,
        totalOut,
        revenueFromSales: Math.round(revenueFromSales * 100) / 100,
        currentStockValue: Math.round(currentStockValue * 100) / 100,
        totalProducts:    allProducts.length,
        lowStockCount:    allProducts.filter((p) => p.isLowStock()).length,
      },
      dailyFlow,
      topSelling,
      productAnalytics,
      needsRestock,
      typeBreakdown,
      recentHistory:    history.slice(0, 50),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
