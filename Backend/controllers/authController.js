const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const user = await User.create({ name, email, password, role });
    const token = signToken(user.id);

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user.id);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

// ─── Email transporter ────────────────────────────────────────────────────────
const nodemailer = require("nodemailer");

const createTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.MAIL_HOST  || "smtp.gmail.com",
    port:   Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

// Generate a random 6-digit code
const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
// Step 1: User enters email → receive 6-digit code
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: "If that email exists, a reset code has been sent." });
    }

    const code    = generateCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save code (plain — we compare directly; short-lived so acceptable)
    await user.update({ resetCode: code, resetExpires: expires });

    // Send email
    const transporter = createTransporter();
    await transporter.sendMail({
      from:    process.env.MAIL_FROM || "SmartStock U.D <noreply@smartstock.com>",
      to:      user.email,
      subject: "SmartStock U.D - Password Reset Code",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <h1 style="color:#7c3aed;font-size:24px;margin:0;">SmartStock U.D</h1>
            <p style="color:#64748b;font-size:14px;margin:4px 0 0;">Password Reset Request</p>
          </div>
          <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
            <p style="color:#374151;font-size:15px;">Hello <strong>${user.name}</strong>,</p>
            <p style="color:#374151;font-size:14px;">You requested to reset your password. Use the code below:</p>
            <div style="text-align:center;margin:24px 0;">
              <div style="display:inline-block;background:#7c3aed;color:#fff;font-size:36px;font-weight:bold;letter-spacing:12px;padding:16px 32px;border-radius:12px;">
                ${code}
              </div>
            </div>
            <p style="color:#64748b;font-size:13px;text-align:center;">This code expires in <strong>15 minutes</strong>.</p>
            <p style="color:#64748b;font-size:13px;text-align:center;">If you did not request this, please ignore this email.</p>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:16px;">SmartStock U.D &copy; ${new Date().getFullYear()}</p>
        </div>
      `,
    });

    res.json({ message: "Reset code sent to your email. Check your inbox." });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ message: "Failed to send reset email. Please try again." });
  }
};

// ─── POST /api/auth/verify-reset-code ────────────────────────────────────────
// Step 2: User enters the 6-digit code → get a short-lived reset token
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: "Email and code are required" });

    const user = await User.findOne({ where: { email } });
    if (!user || !user.resetCode || !user.resetExpires) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    if (user.resetCode !== code.trim()) {
      return res.status(400).json({ message: "Incorrect code. Please try again." });
    }

    if (new Date() > new Date(user.resetExpires)) {
      await user.update({ resetCode: null, resetExpires: null });
      return res.status(400).json({ message: "Code has expired. Please request a new one." });
    }

    // Issue a short-lived reset token (5 min)
    const resetToken = jwt.sign(
      { id: user.id, purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    // Clear the code so it can't be reused
    await user.update({ resetCode: null, resetExpires: null });

    res.json({ message: "Code verified.", resetToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
// Step 3: User sets new password using the reset token
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: "Reset token and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: "Reset link has expired. Please start over." });
    }

    if (decoded.purpose !== "password-reset") {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update password (beforeUpdate hook will hash it)
    await user.update({ password: newPassword });

    res.json({ message: "Password reset successfully! You can now sign in." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
