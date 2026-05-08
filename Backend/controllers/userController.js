const User = require("../models/User");

// GET /api/users  (admin only)
exports.getAll = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password", "resetCode", "resetExpires"] },
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

    const targetId = Number(req.params.id);

    // Rule 1: Admin cannot change their own role
    if (targetId === req.user.id) {
      return res.status(403).json({ message: "You cannot change your own role." });
    }

    const user = await User.findByPk(targetId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Rule 2: Cannot demote the last admin
    if (user.role === "admin" && role !== "admin") {
      const adminCount = await User.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        return res.status(403).json({
          message: "Cannot demote the last admin. Promote another user to admin first.",
        });
      }
    }

    // Rule 3: Only an admin can promote someone to admin
    if (role === "admin" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only an admin can promote users to admin." });
    }

    await user.update({ role });
    const { password: _, resetCode: __, resetExpires: ___, ...safe } = user.toJSON();
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/users/:id  (admin only)
exports.remove = async (req, res) => {
  try {
    const targetId = Number(req.params.id);

    // Rule 1: Cannot delete yourself
    if (targetId === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    const user = await User.findByPk(targetId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Rule 2: Cannot delete the last admin
    if (user.role === "admin") {
      const adminCount = await User.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        return res.status(403).json({
          message: "Cannot delete the last admin account.",
        });
      }
    }

    await user.destroy();
    res.json({ message: "User deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
