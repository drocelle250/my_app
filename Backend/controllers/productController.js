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
    const product = await Product.create(req.body);
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

    await product.update(req.body);
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
