const router = require("express").Router();
const { body } = require("express-validator");
const { getAll, create, update, remove } = require("../controllers/categoryController");
const { protect, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/errorHandler");

router.use(protect);

router.get("/", getAll);

router.post(
  "/",
  authorize("admin", "manager"),
  [body("name").notEmpty().withMessage("Category name is required")],
  validate,
  create
);

router.put(
  "/:id",
  authorize("admin", "manager"),
  [body("name").optional().notEmpty().withMessage("Name cannot be empty")],
  validate,
  update
);

router.delete("/:id", authorize("admin"), remove);

module.exports = router;
