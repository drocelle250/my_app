const router = require("express").Router();
const { body } = require("express-validator");
const { restock, deduct, history, lowStock, dashboard, analytics } = require("../controllers/stockController");
const { protect, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/errorHandler");

router.use(protect);

router.get("/dashboard",              dashboard);
router.get("/low-stock",              lowStock);
router.get("/history/:productId",     history);
router.get("/analytics",              authorize("admin", "manager"), analytics);

router.post(
  "/restock",
  authorize("admin", "manager"),
  [
    body("productId").notEmpty().withMessage("Product ID is required"),
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
  ],
  validate,
  restock
);

router.post(
  "/deduct",
  authorize("admin", "manager", "staff"),
  [
    body("productId").notEmpty().withMessage("Product ID is required"),
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
  ],
  validate,
  deduct
);

module.exports = router;
