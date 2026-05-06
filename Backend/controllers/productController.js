const { Op } = require("sequelize");
const Product  = require("../models/Product");
const Category = require("../models/Category");

// GET /api/products  — pagination, filtering, search
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, categoryId, search, lowStock } = req.query;
    const where = {};

    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku:  { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
      limit: Number(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    // low stock filter (post-query)
    const products = lowStock === "true" ? rows.filter((p) => p.isLowStock()) : rows;

    res.json({ total: count, page: Number(page), pages: Math.ceil(count / limit), products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/:id
exports.getOne = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/products
exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    // req.files is populated by upload.imageAndVideo (fields middleware)
    if (req.files?.image?.[0]) data.imageUrl = `/uploads/images/${req.files.image[0].filename}`;
    if (req.files?.video?.[0]) data.videoUrl = `/uploads/videos/${req.files.video[0].filename}`;
    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "SKU already exists" });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/products/:id
exports.update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const data = { ...req.body };
    if (req.files?.image?.[0]) data.imageUrl = `/uploads/images/${req.files.image[0].filename}`;
    if (req.files?.video?.[0]) data.videoUrl = `/uploads/videos/${req.files.video[0].filename}`;

    // Allow explicit removal via flags sent from frontend
    if (req.body.removeImage === "true") data.imageUrl = null;
    if (req.body.removeVideo === "true") data.videoUrl = null;

    await product.update(data);
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/products/:id
exports.remove = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await product.destroy();
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/:id/recommendations
// Returns: same-category products + price-similar products + top-selling products
exports.getRecommendations = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const maxLimit = Math.min(Number(limit), 20);

    // Load the source product
    const source = await Product.findByPk(req.params.id, {
      include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
    });
    if (!source) return res.status(404).json({ message: "Product not found" });

    const sourcePrice = parseFloat(source.price);

    // ── 1. Same category (exclude self, in-stock first) ──────────────────────
    const sameCategory = await Product.findAll({
      where: {
        categoryId: source.categoryId,
        id: { [Op.ne]: source.id },
        quantity: { [Op.gt]: 0 },
      },
      include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
      order: [["quantity", "DESC"]],
      limit: maxLimit,
    });

    // ── 2. Price-similar (±40% of source price, different category) ──────────
    const priceLow  = sourcePrice * 0.6;
    const priceHigh = sourcePrice * 1.4;

    const priceSimilar = await Product.findAll({
      where: {
        id:         { [Op.ne]: source.id },
        categoryId: { [Op.ne]: source.categoryId },
        price:      { [Op.between]: [priceLow, priceHigh] },
        quantity:   { [Op.gt]: 0 },
      },
      include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
      limit: maxLimit,
    });

    // ── 3. Top-selling (from StockHistory sales, last 30 days) ───────────────
    const StockHistory = require("../models/StockHistory");
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const salesData = await StockHistory.findAll({
      where: {
        type:      "sale",
        createdAt: { [Op.gte]: since },
        productId: { [Op.ne]: source.id },
      },
      attributes: ["productId"],
      raw: true,
    });

    // Count sales per product
    const salesCount = {};
    salesData.forEach((s) => {
      salesCount[s.productId] = (salesCount[s.productId] || 0) + 1;
    });

    const topIds = Object.entries(salesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxLimit)
      .map(([id]) => Number(id));

    let topSelling = [];
    if (topIds.length > 0) {
      topSelling = await Product.findAll({
        where: {
          id:       { [Op.in]: topIds, [Op.ne]: source.id },
          quantity: { [Op.gt]: 0 },
        },
        include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
      });
      // Sort by sales count
      topSelling.sort((a, b) => (salesCount[b.id] || 0) - (salesCount[a.id] || 0));
    }

    // ── Deduplicate across all three lists ────────────────────────────────────
    const seen = new Set([source.id]);
    const dedup = (list) => list.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    res.json({
      sourceProduct: {
        id:       source.id,
        name:     source.name,
        category: source.category?.name,
        price:    sourcePrice,
      },
      recommendations: {
        sameCategory:  dedup(sameCategory).slice(0, 4),
        priceSimilar:  dedup(priceSimilar).slice(0, 4),
        topSelling:    dedup(topSelling).slice(0, 4),
      },
    });
  } catch (err) {
    console.error("Recommendations error:", err);
    res.status(500).json({ message: err.message });
  }
};
