const router  = require("express").Router();
const { body } = require("express-validator");
const { getAll, getOne, create, update, remove, getRecommendations } = require("../controllers/productController");
const { protect, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/errorHandler");
const upload   = require("../middleware/upload");

router.use(protect);

// ── Public reads ──────────────────────────────────────────────────────────────
router.get("/",    getAll);
router.get("/:id", getOne);

// ── Create product (image + video) ───────────────────────────────────────────
router.post(
  "/",
  authorize("admin", "manager"),
  upload.imageAndVideo,
  upload.checkSizes,
  [
    body("name").notEmpty().withMessage("Product name is required"),
    body("sku").notEmpty().withMessage("SKU is required"),
    body("price").isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
    body("quantity").isInt({ min: 0 }).withMessage("Quantity must be a non-negative integer"),
    body("categoryId").notEmpty().withMessage("Category is required"),
  ],
  validate,
  create
);

// ── Update product (image + video) ───────────────────────────────────────────
router.put(
  "/:id",
  authorize("admin", "manager"),
  upload.imageAndVideo,
  upload.checkSizes,
  [
    body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
    body("quantity").optional().isInt({ min: 0 }).withMessage("Quantity must be a non-negative integer"),
  ],
  validate,
  update
);

// GET /api/products/:id/recommendations
router.get("/:id/recommendations", getRecommendations);

// ── Delete product ────────────────────────────────────────────────────────────
router.delete("/:id", authorize("admin"), remove);

module.exports = router;
