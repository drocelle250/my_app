const router = require("express").Router();
const { body } = require("express-validator");
const { register, login, getMe, forgotPassword, verifyResetCode, resetPassword } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/errorHandler");

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

router.get("/me", protect, getMe);

// ── Password reset flow ───────────────────────────────────────────────────────
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email is required")],
  validate,
  forgotPassword
);

router.post(
  "/verify-reset-code",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("code").isLength({ min: 6, max: 6 }).withMessage("Code must be 6 digits"),
  ],
  validate,
  verifyResetCode
);

router.post(
  "/reset-password",
  [
    body("resetToken").notEmpty().withMessage("Reset token is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  resetPassword
);

module.exports = router;
