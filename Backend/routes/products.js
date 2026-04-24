const router = require("express").Router();
const { body } = require("express-validator");
const { getAll, getOne, create, update, remove } = require("../controllers/productController");
const { protect, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/errorHandler");

router.use(protect);

router.get("/", getAll);
router.get("/:id", getOne);

router.post(
  "/",
  authorize("admin", "manager"),
  [
    body("name").notEmpty().withMessage("Product name is required"),
    body("sku").notEmpty().withMessage("SKU is required"),
    body("price").isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
    body("quantity").isInt({ min: 0 }).withMessage("Quantity must be a non-negative integer"),
    body("category").notEmpty().withMessage("Category is required"),
  ],
  validate,
  create
);

router.put(
  "/:id",
  authorize("admin", "manager"),
  [
    body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
    body("quantity").optional().isInt({ min: 0 }).withMessage("Quantity must be a non-negative integer"),
  ],
  validate,
  update
);

router.delete("/:id", authorize("admin"), remove);

module.exports = router;
