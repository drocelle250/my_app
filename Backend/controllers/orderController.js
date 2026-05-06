const { sequelize } = require("../config/db");
const { Order, OrderItem } = require("../models/Order");
const Product  = require("../models/Product");
const Category = require("../models/Category");
const User     = require("../models/User");
const StockHistory = require("../models/StockHistory");

// POST /api/orders  — user places an order
exports.placeOrder = async (req, res) => {
  const { items, note } = req.body;
  // items: [{ productId, quantity }]
  if (!items || items.length === 0)
    return res.status(400).json({ message: "Cart is empty" });

  try {
    const result = await sequelize.transaction(async (t) => {
      let totalAmount = 0;
      const enriched = [];

      for (const item of items) {
        const product = await Product.findByPk(item.productId, { transaction: t, lock: true });
        if (!product) throw Object.assign(new Error(`Product #${item.productId} not found`), { statusCode: 404 });
        if (product.quantity < item.quantity)
          throw Object.assign(
            new Error(`Not enough stock for "${product.name}". Available: ${product.quantity}`),
            { statusCode: 400 }
          );
        totalAmount += parseFloat(product.price) * item.quantity;
        enriched.push({ product, quantity: item.quantity, unitPrice: parseFloat(product.price) });
      }

      const order = await Order.create(
        { userId: req.user.id, totalAmount, note, status: "pending" },
        { transaction: t }
      );

      for (const e of enriched) {
        await OrderItem.create(
          { orderId: order.id, productId: e.product.id, quantity: e.quantity, unitPrice: e.unitPrice },
          { transaction: t }
        );
        // Deduct stock
        await e.product.update({ quantity: e.product.quantity - e.quantity }, { transaction: t });
        await StockHistory.create(
          { productId: e.product.id, type: "sale", quantity: -e.quantity, note: `Order #${order.id}`, performedById: req.user.id },
          { transaction: t }
        );
      }

      return order;
    });

    const full = await Order.findByPk(result.id, {
      include: [
        { model: OrderItem, as: "items", include: [{ model: Product, as: "product", attributes: ["id","name","sku","price"] }] },
        { model: User, as: "user", attributes: ["id","name","email"] },
      ],
    });
    res.status(201).json(full);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

// GET /api/orders/my  — user sees their own orders
exports.myOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        { model: OrderItem, as: "items", include: [{ model: Product, as: "product", attributes: ["id","name","sku","price"] }] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders  — admin/manager sees all orders
exports.allOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: User, as: "user", attributes: ["id","name","email"] },
        { model: OrderItem, as: "items", include: [{ model: Product, as: "product", attributes: ["id","name","sku","price"] }] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/orders/:id/status  — admin/manager updates order status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    await order.update({ status });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
