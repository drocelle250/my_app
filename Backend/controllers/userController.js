const User = require("../models/User");

// GET /api/users  (admin only)
exports.getAll = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/:id/role  (admin only)
exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ["admin", "manager", "staff"];
    if (!allowed.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.update({ role });
    const { password: _, ...safe } = user.toJSON();
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/users/:id  (admin only)
exports.remove = async (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.destroy();
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
